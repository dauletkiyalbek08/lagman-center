-- ============================================================
-- Lagman Center — схема базы данных Supabase (Postgres + RLS)
-- Выполните этот файл целиком в Supabase: SQL Editor -> New query -> Run
-- ============================================================

-- ---------- Таблицы ----------

create table public.establishments (
  id   text primary key,
  name text not null,
  address text not null,
  hours text not null,
  tag  text
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'admin', 'kitchen', 'courier')),
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price int not null check (price >= 0),
  category text not null,
  image_url text,
  establishment_id text references public.establishments (id),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Номер заявки вида #00042
create sequence public.order_number_seq start 42;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default '#' || lpad(nextval('public.order_number_seq')::text, 5, '0'),
  customer_id uuid references auth.users (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'cooking', 'ready', 'delivering', 'delivered', 'cancelled')),
  total int not null default 0 check (total >= 0),
  address text not null,
  phone text not null,
  customer_name text not null default '',
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'card', 'kaspi')),
  comment text,
  courier_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  price_snapshot int not null check (price_snapshot >= 0),
  quantity int not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  date date not null,
  time text not null,
  guests int not null check (guests > 0),
  establishment_id text references public.establishments (id),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------- Триггеры ----------

-- Профиль создаётся автоматически при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at при каждом изменении заказа
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- Роли: хелпер ----------

-- security definer, чтобы читать profiles в обход RLS внутри политик
create or replace function public.my_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Создание заказа и брони — через SECURITY DEFINER функции.
--
-- Почему не прямой INSERT из браузера: в Postgres `insert ... returning`
-- требует ещё и SELECT-политику, а гость (anon) по определению не может
-- читать чужие заказы. Плюс заказ и его позиции должны создаваться
-- атомарно, а цены — считаться на сервере, чтобы их нельзя было подделать
-- из devtools. Обе задачи решает одна функция.
-- ============================================================

create or replace function public.create_order(
  p_address text,
  p_phone text,
  p_customer_name text,
  p_payment_method text,
  p_comment text,
  -- [{ "menu_item_id": uuid|null, "name": text, "price": int, "quantity": int }, ...]
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_menu_id uuid;
  v_name text;
  v_price int;
  v_qty int;
  v_total int := 0;
begin
  if coalesce(btrim(p_address), '') = '' then
    raise exception 'Укажите адрес доставки';
  end if;
  if coalesce(btrim(p_phone), '') = '' then
    raise exception 'Укажите телефон';
  end if;
  if coalesce(p_payment_method, '') not in ('cash', 'card', 'kaspi') then
    raise exception 'Неизвестный способ оплаты';
  end if;
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Корзина пуста';
  end if;

  insert into public.orders (
    customer_id, status, total, address, phone,
    customer_name, payment_method, comment
  )
  values (
    auth.uid(), 'new', 0, btrim(p_address), btrim(p_phone),
    coalesce(btrim(p_customer_name), ''), p_payment_method,
    nullif(btrim(coalesce(p_comment, '')), '')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item ->> 'quantity')::int, 1), 1);

    -- цену и название берём из БД; фолбэк на присланные значения нужен
    -- только для демо-меню, которого нет в menu_items
    v_menu_id := null;
    v_menu := null;
    begin
      v_menu_id := (v_item ->> 'menu_item_id')::uuid;
    exception when others then
      v_menu_id := null;
    end;

    if v_menu_id is not null then
      select * into v_menu from public.menu_items where id = v_menu_id;
    end if;

    if v_menu.id is not null then
      v_name := v_menu.name;
      v_price := v_menu.price;
    else
      v_menu_id := null;
      v_name := coalesce(nullif(btrim(v_item ->> 'name'), ''), 'Позиция');
      v_price := greatest(coalesce((v_item ->> 'price')::int, 0), 0);
    end if;

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, price_snapshot, quantity
    )
    values (v_order.id, v_menu_id, v_name, v_price, v_qty);

    v_total := v_total + v_price * v_qty;
  end loop;

  update public.orders set total = v_total
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- Статус заказа по его id (id — неугадываемый uuid).
-- Нужен гостю, который оформил заказ без регистрации: читать саму строку
-- заказа ему нельзя, а видеть статус доставки — можно.
create or replace function public.order_status(p_order_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select status from public.orders where id = p_order_id;
$$;

create or replace function public.create_reservation(
  p_name text,
  p_phone text,
  p_date date,
  p_time text,
  p_guests int,
  p_establishment_id text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Укажите имя';
  end if;
  if coalesce(btrim(p_phone), '') = '' then
    raise exception 'Укажите телефон';
  end if;
  if p_date is null or p_date < current_date then
    raise exception 'Дата брони не может быть в прошлом';
  end if;
  if coalesce(p_guests, 0) < 1 then
    raise exception 'Укажите количество гостей';
  end if;

  insert into public.reservations (
    name, phone, date, time, guests, establishment_id, status
  )
  values (
    btrim(p_name), btrim(p_phone), p_date, p_time,
    p_guests, p_establishment_id, 'new'
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

grant execute on function public.create_order(text, text, text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.order_status(uuid) to anon, authenticated;
grant execute on function public.create_reservation(text, text, date, text, int, text)
  to anon, authenticated;

-- Триггерную функцию снаружи звать незачем. EXECUTE по умолчанию выдан роли
-- PUBLIC, поэтому забираем именно у неё (revoke от anon/authenticated не помог бы).
-- На триггер это не влияет: права проверяются при создании триггера, не при срабатывании.
revoke execute on function public.handle_new_user() from public;

-- ---------- Row Level Security ----------

alter table public.establishments enable row level security;
alter table public.profiles       enable row level security;
alter table public.menu_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.reservations   enable row level security;

-- Заведения: читают все, правит админ
create policy "establishments: public read"
  on public.establishments for select using (true);
create policy "establishments: admin write"
  on public.establishments for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Профили: свой видит каждый, админ видит и правит все
create policy "profiles: read own"
  on public.profiles for select using (id = auth.uid());
create policy "profiles: admin read all"
  on public.profiles for select using (public.my_role() = 'admin');
create policy "profiles: update own (без смены роли)"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());
create policy "profiles: admin update all"
  on public.profiles for update
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Меню: читают все (включая гостей), правит админ
create policy "menu: public read"
  on public.menu_items for select using (true);
create policy "menu: admin write"
  on public.menu_items for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Заказы.
-- INSERT-политик нет: заказ создаётся только через create_order().
--
-- Персонал (админ/кухня/курьер) читает ВСЕ заказы. Это осознанно: Realtime
-- отдаёт событие лишь тогда, когда подписчик может прочитать НОВУЮ версию
-- строки. Если бы кухня видела только `cooking`, то при отмене или переводе
-- заказа в `ready` событие до неё бы не дошло и карточка зависла бы на доске
-- навсегда. Права на ИЗМЕНЕНИЕ статуса при этом остаются узкими (ниже).
create policy "orders: customer reads own"
  on public.orders for select using (customer_id = auth.uid());
create policy "orders: staff reads all"
  on public.orders for select
  using (public.my_role() in ('admin', 'kitchen', 'courier'));

create policy "orders: admin updates"
  on public.orders for update
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');
-- Кухня: только cooking -> ready. Роль указана и в USING, и в WITH CHECK:
-- permissive-политики объединяются через OR, поэтому без проверки роли
-- в WITH CHECK кухня смогла бы поставить статус курьера.
create policy "orders: kitchen marks ready"
  on public.orders for update
  using (public.my_role() = 'kitchen' and status = 'cooking')
  with check (public.my_role() = 'kitchen' and status = 'ready');
-- Курьер: ready -> delivering -> delivered
create policy "orders: courier delivers"
  on public.orders for update
  using (public.my_role() = 'courier' and status in ('ready', 'delivering'))
  with check (
    public.my_role() = 'courier' and status in ('delivering', 'delivered')
  );

-- Позиции заказа: пишутся только внутри create_order()
create policy "order_items: customer reads own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );
create policy "order_items: staff reads all"
  on public.order_items for select
  using (public.my_role() in ('admin', 'kitchen', 'courier'));

-- Брони: создаются через create_reservation(), управляет админ
create policy "reservations: admin read"
  on public.reservations for select using (public.my_role() = 'admin');
create policy "reservations: admin update"
  on public.reservations for update
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- ---------- Realtime ----------

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.menu_items;

-- ---------- Сид-данные ----------

insert into public.establishments (id, name, address, hours, tag) values
  ('shashlychny-dvor', 'Шашлычный двор', 'Летняя терраса в парке, Щучинск', '10:00 – 23:00', 'Летняя терраса'),
  ('lagman-center',    'Lagman Center',  'Щучинск, Халал Кафе',             '10:00 – 23:00', 'Кафе');

insert into public.menu_items (name, description, price, category, image_url, establishment_id) values
  ('Лагман',              'Классический лагман по-узбекски',                2490, 'Основные блюда', '/images/lagman.jpg',           'lagman-center'),
  ('Плов',                'Сочный плов с бараниной',                        2190, 'Основные блюда', '/images/plov.jpg',             'lagman-center'),
  ('Манты',               'Домашние манты с сочной бараниной и луком, 5 шт.', 1890, 'Основные блюда', '/images/manty.jpg',          'lagman-center'),
  ('Шорпа',               'Наваристый бульон с бараниной и овощами',        1690, 'Основные блюда', '/images/shorpa.jpg',           'lagman-center'),
  ('Гуйру-лагман',        'Жареный лагман с говядиной и овощами',           2690, 'Основные блюда', '/images/guiru-lagman.jpg',     'lagman-center'),
  ('Шашлык из баранины',  'Сочный шашлык из отборной баранины',             2990, 'Шашлык',         '/images/shashlik-lamb.jpg',    'shashlychny-dvor'),
  ('Шашлык из курицы',    'Нежное куриное филе в фирменном маринаде',       1990, 'Шашлык',         '/images/shashlik-chicken.jpg', 'shashlychny-dvor'),
  ('Шашлык из говядины',  'Мраморная говядина на углях',                    2790, 'Шашлык',         '/images/shashlik-beef.jpg',    'shashlychny-dvor'),
  ('Люля-кебаб',          'Рубленая баранина с зеленью на мангале',         2490, 'Шашлык',         '/images/lyulya-kebab.jpg',     'shashlychny-dvor'),
  ('Самса',               'Хрустящая самса с мясной начинкой',               690, 'Выпечка',        '/images/samsa.jpg',            'lagman-center'),
  ('Лепёшка тандырная',   'Горячая лепёшка из тандыра',                      350, 'Выпечка',        '/images/lepyoshka.jpg',        'lagman-center'),
  ('Баурсаки',            'Воздушные баурсаки к чаю, 10 шт.',                590, 'Выпечка',        null,                           'lagman-center'),
  ('Картофель фри',       'Хрустящий картофель со специями',                 890, 'Гарниры',        '/images/fries.jpg',            'shashlychny-dvor'),
  ('Ачичук',              'Свежие помидоры, лук и зелень',                   990, 'Салаты',         '/images/achichuk.jpg',         'lagman-center'),
  ('Овощной салат',       'Огурцы, помидоры, зелень и масло',               1190, 'Салаты',         '/images/fresh-salad.jpg',      'lagman-center'),
  ('Чай в чайнике',       'Чёрный или зелёный чай, 1 л',                     690, 'Напитки',        '/images/tea-pot.jpg',          'lagman-center'),
  ('Морс ягодный',        'Домашний морс из свежих ягод, 0.5 л',             590, 'Напитки',        '/images/morse.jpg',            'lagman-center'),
  ('Газированные напитки','Coca-Cola, Fanta, Sprite, 0.5 л',                 490, 'Напитки',        '/images/cola.jpg',             'lagman-center');

-- ============================================================
-- После выполнения схемы:
-- 1) Зарегистрируйтесь на сайте (/register).
-- 2) Назначьте себе роль администратора:
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'ВАШ_EMAIL');
-- 3) Аккаунты кухни и курьера: сотрудник регистрируется на /register,
--    затем админ назначает роль в панели /admin (вкладка «Персонал»).
-- ============================================================
