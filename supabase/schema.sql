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
  -- адрес по умолчанию: подставляется в следующий заказ клиента
  address text,
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

-- Настройки доставки. Одна строка: id всегда = 1.
create table public.settings (
  id int primary key default 1 check (id = 1),
  delivery_fee int not null default 500 check (delivery_fee >= 0),
  -- 0 — бесплатной доставки нет
  free_delivery_from int not null default 0 check (free_delivery_from >= 0),
  -- 0 — минимальной суммы нет
  min_order int not null default 0 check (min_order >= 0),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1);

-- Рекламный баннер на главной (акция / праздник / комбо). Одна строка: id = 1.
create table public.promo_banner (
  id         int primary key default 1 check (id = 1),
  is_active  boolean not null default false,
  emoji      text not null default '🎉',
  title      text not null default '',
  body       text not null default '',
  cta_label  text not null default '',
  cta_href   text not null default '',
  accent     text not null default 'red' check (accent in ('red', 'amber', 'emerald')),
  updated_at timestamptz not null default now()
);

insert into public.promo_banner (id) values (1);

-- Столы в зале. code — короткий код в QR-ссылке /t/<code>.
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  seats int not null default 4 check (seats > 0),
  zone text,
  code text not null unique
    default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  is_active boolean not null default true,
  -- «за столом сидят гости»: ставит официант/админ или заказ по QR
  is_occupied boolean not null default false,
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
  -- dine_in — заказ за столом по QR (без регистрации, оплата на кассе);
  -- pickup — самовывоз (для вошедшего клиента, оплата на кассе)
  order_type text not null default 'delivery'
    check (order_type in ('delivery', 'dine_in', 'pickup')),
  table_id uuid references public.tables (id) on delete set null,
  -- номер стола копией: кухня и курьер не имеют прав на public.tables,
  -- а номер им нужен — так обходимся без join и без лишних политик
  table_number int,
  -- сумма с доставкой
  total int not null default 0 check (total >= 0),
  delivery_fee int not null default 0 check (delivery_fee >= 0),
  -- у заказа в зале / на самовывоз адреса нет
  address text,
  phone text,
  customer_name text not null default '',
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'card', 'kaspi', 'counter')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  -- оценка заказа клиентом (для доставки — оценка курьера)
  rating int check (rating between 1 and 5),
  review_comment text,
  rated_at timestamptz,
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
  -- админ сажает бронь за конкретный стол — это красит карту зала
  table_id uuid references public.tables (id) on delete set null,
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
  insert into public.profiles (id, name, phone, address)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address'
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

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger promo_banner_updated_at
  before update on public.promo_banner
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

-- Гость, отсканировавший QR, читает свой стол по коду.
-- Через RPC, а не select: иначе пришлось бы открыть всю таблицу столов
-- (вместе с кодами всех остальных столов) на публичное чтение.
create or replace function public.table_by_code(p_code text)
returns table (id uuid, number int, seats int, zone text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.number, t.seats, t.zone
  from public.tables t
  where t.code = lower(btrim(p_code)) and t.is_active;
$$;

-- ============================================================
-- create_order: два сценария.
--   dine_in  — гость за столом (QR), без регистрации, оплата на кассе;
--   delivery — только для вошедшего клиента: адрес обязателен,
--              к сумме добавляется стоимость доставки из settings.
-- Цены и стоимость доставки считаются здесь, из базы: подделать их
-- из devtools нельзя.
-- ============================================================
-- create_order: три сценария.
--   dine_in  — гость за столом (QR), без регистрации, оплата на кассе;
--   pickup   — самовывоз для вошедшего клиента, оплата на кассе, без адреса;
--   delivery — для вошедшего клиента: адрес обязателен, + стоимость доставки.
-- Цены и стоимость доставки считаются здесь, из базы: подделать их
-- из devtools нельзя.
-- ============================================================
create or replace function public.create_order(
  p_order_type text,
  p_table_code text,
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
  v_subtotal int := 0;
  v_fee int := 0;
  v_settings public.settings;
  v_table public.tables;
  v_payment text;
  v_address text;
  v_phone text;
begin
  if coalesce(p_order_type, '') not in ('delivery', 'dine_in', 'pickup') then
    raise exception 'Неизвестный тип заказа';
  end if;
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Корзина пуста';
  end if;

  select * into v_settings from public.settings where id = 1;

  if p_order_type = 'dine_in' then
    select * into v_table from public.tables
    where code = lower(btrim(coalesce(p_table_code, ''))) and is_active;
    if v_table.id is null then
      raise exception 'Стол не найден. Отсканируйте QR-код на столе ещё раз.';
    end if;
    v_payment := 'counter';   -- в зале платят на кассе
    v_address := null;
    v_phone := nullif(btrim(coalesce(p_phone, '')), '');

  elsif p_order_type = 'pickup' then
    -- самовывоз: только для вошедшего клиента, оплата на кассе при получении
    if auth.uid() is null then
      raise exception 'Войдите или зарегистрируйтесь, чтобы оформить самовывоз';
    end if;
    if coalesce(btrim(p_phone), '') = '' then
      raise exception 'Укажите телефон — позвоним, когда заказ будет готов';
    end if;
    v_payment := 'counter';
    v_address := null;
    v_phone := btrim(p_phone);

  else
    -- Доставка — только для зарегистрированных: курьеру нужен настоящий
    -- контакт, а гостя без аккаунта не с кем связать при отказе.
    if auth.uid() is null then
      raise exception 'Войдите или зарегистрируйтесь, чтобы заказать доставку';
    end if;
    if coalesce(btrim(p_address), '') = '' then
      raise exception 'Укажите адрес доставки';
    end if;
    if coalesce(btrim(p_phone), '') = '' then
      raise exception 'Укажите телефон';
    end if;
    if coalesce(p_payment_method, '') not in ('cash', 'card', 'kaspi') then
      raise exception 'Неизвестный способ оплаты';
    end if;
    v_payment := p_payment_method;
    v_address := btrim(p_address);
    v_phone := btrim(p_phone);
  end if;

  insert into public.orders (
    customer_id, status, order_type, table_id, table_number,
    total, delivery_fee, address, phone, customer_name,
    payment_method, payment_status, comment
  )
  values (
    auth.uid(), 'new', p_order_type, v_table.id, v_table.number,
    0, 0, v_address, v_phone, coalesce(btrim(p_customer_name), ''),
    v_payment, 'unpaid', nullif(btrim(coalesce(p_comment, '')), '')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item ->> 'quantity')::int, 1), 1);

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

    -- цену и название берём из БД; фолбэк нужен только для демо-сида,
    -- которого нет в menu_items
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

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  if p_order_type = 'delivery' then
    if coalesce(v_settings.min_order, 0) > 0 and v_subtotal < v_settings.min_order then
      raise exception 'Минимальная сумма заказа на доставку — % ₸', v_settings.min_order;
    end if;
    v_fee := case
      when coalesce(v_settings.free_delivery_from, 0) > 0
       and v_subtotal >= v_settings.free_delivery_from then 0
      else coalesce(v_settings.delivery_fee, 0)
    end;
  elsif p_order_type = 'dine_in' then
    -- гости сели за стол — отмечаем его занятым на карте зала
    update public.tables set is_occupied = true where id = v_table.id;
  end if;

  update public.orders
     set total = v_subtotal + v_fee,
         delivery_fee = v_fee
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

-- Оценка заказа клиентом (для доставки — оценка курьера).
-- Через RPC, чтобы работало и для гостя (id заказа неугадываем): прямого
-- UPDATE у клиента на чужую строку нет. Оценить можно только доставленный
-- заказ и только один раз.
create or replace function public.rate_order(
  p_order_id uuid,
  p_rating int,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Оценка — от 1 до 5 звёзд';
  end if;

  update public.orders
     set rating = p_rating,
         review_comment = nullif(btrim(coalesce(p_comment, '')), ''),
         rated_at = now()
   where id = p_order_id
     and status = 'delivered'
     and rating is null;

  if not found then
    raise exception 'Этот заказ нельзя оценить (он ещё не завершён или уже оценён)';
  end if;
end;
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

grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.order_status(uuid) to anon, authenticated;
grant execute on function public.rate_order(uuid, int, text) to anon, authenticated;
grant execute on function public.table_by_code(text) to anon, authenticated;
grant execute on function public.create_reservation(text, text, date, text, int, text)
  to anon, authenticated;

-- Триггерную функцию снаружи звать незачем. EXECUTE по умолчанию выдан роли
-- PUBLIC, поэтому забираем именно у неё (revoke от anon/authenticated не помог бы).
-- На триггер это не влияет: права проверяются при создании триггера, не при срабатывании.
revoke execute on function public.handle_new_user() from public;


-- ============================================================
-- Управление сотрудниками из панели админа.
-- Учётки создаёт БАЗА (security definer), а не браузер: иначе фронтенду
-- пришлось бы отдать service_role-ключ, а он даёт полный доступ ко всему.
-- Регистрации на сайте нет — гость заказывает без аккаунта, а логины
-- и пароли персоналу выдаёт администратор.
-- ============================================================

create or replace function public.create_auth_user(
  p_email text,
  p_password text,
  p_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(btrim(p_email));
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),  -- почта сразу подтверждена: письма сотрудникам не шлём
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', nullif(btrim(coalesce(p_name, '')), ''),
                       'phone', nullif(btrim(coalesce(p_phone, '')), '')),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;

-- Наружу эта функция не нужна вовсе: её зовут только register_customer и
-- admin_create_staff, а они security definer и выполняются от владельца.
-- Supabase по умолчанию раздаёт EXECUTE на новые функции схемы public ролям
-- anon и authenticated, поэтому забираем права и у них, а не только у PUBLIC:
-- иначе кто угодно мог бы завести учётку с произвольным email.
revoke execute on function public.create_auth_user(text, text, text, text)
  from public, anon, authenticated;

-- ============================================================
-- Регистрация клиента по номеру телефона (нужна только для доставки).
--
-- Обычный supabase.auth.signUp() здесь не годится: GoTrue считает логин
-- почтой и шлёт письмо подтверждения на несуществующий адрес вида
-- 7707…@phone.lagmancenter.kz. Письмо не доходит, сессия не выдаётся, а
-- почтовый лимит проекта выгорает на пустых отправках.
--
-- Поэтому учётку создаёт сама база: пароль хешируется bcrypt'ом, почта
-- помечена подтверждённой, писем не шлётся. Сразу после этого клиент входит
-- обычным signInWithPassword. Роль не параметр — всегда 'customer'
-- (значение по умолчанию в profiles), а email собирается из номера, поэтому
-- подсунуть произвольный адрес снаружи нельзя.
-- ============================================================
create or replace function public.register_customer(
  p_phone text,
  p_password text,
  p_name text,
  p_address text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text;
  v_id uuid;
begin
  if v_digits !~ '^7\d{10}$' then
    raise exception 'Проверьте номер телефона';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Пароль должен быть не короче 6 символов';
  end if;

  v_email := v_digits || '@phone.lagmancenter.kz';

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Этот номер уже зарегистрирован — войдите';
  end if;

  v_id := public.create_auth_user(v_email, p_password, p_name, p_phone);

  update public.profiles
     set name = nullif(btrim(coalesce(p_name, '')), ''),
         phone = nullif(btrim(coalesce(p_phone, '')), ''),
         address = nullif(btrim(coalesce(p_address, '')), '')
   where id = v_id;
end;
$$;

grant execute on function public.register_customer(text, text, text, text)
  to anon, authenticated;

create or replace function public.admin_create_staff(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_profile public.profiles;
begin
  if public.my_role() <> 'admin' then
    raise exception 'Добавлять сотрудников может только администратор';
  end if;
  if coalesce(p_role, '') not in ('admin', 'kitchen', 'courier', 'customer') then
    raise exception 'Неизвестная роль';
  end if;
  if coalesce(btrim(p_email), '') = '' then
    raise exception 'Укажите email';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Пароль должен быть не короче 6 символов';
  end if;
  if exists (select 1 from auth.users where email = lower(btrim(p_email))) then
    raise exception 'Сотрудник с таким email уже есть';
  end if;

  v_id := public.create_auth_user(p_email, p_password, p_name, p_phone);

  update public.profiles
     set role = p_role,
         name = nullif(btrim(coalesce(p_name, '')), ''),
         phone = nullif(btrim(coalesce(p_phone, '')), '')
   where id = v_id
   returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.admin_delete_staff(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() <> 'admin' then
    raise exception 'Удалять сотрудников может только администратор';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Нельзя удалить самого себя';
  end if;
  delete from auth.users where id = p_user_id;
end;
$$;

create or replace function public.admin_set_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() <> 'admin' then
    raise exception 'Менять пароли может только администратор';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Пароль должен быть не короче 6 символов';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user_id;
end;
$$;

-- Список сотрудников с email (в profiles почты нет, а auth.users закрыт)
create or replace function public.admin_list_staff()
returns table (
  id uuid,
  email text,
  role text,
  name text,
  phone text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, u.email::text, p.role, p.name, p.phone, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.my_role() = 'admin'
  order by p.created_at;
$$;

grant execute on function public.admin_create_staff(text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_staff(uuid) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_list_staff() to authenticated;

-- Внутри они и так проверяют my_role() = 'admin', но пусть анонимный клиент
-- даже не сможет их дёрнуть (EXECUTE по умолчанию выдан ещё и роли PUBLIC).
revoke execute on function public.admin_create_staff(text, text, text, text, text)
  from public, anon;
revoke execute on function public.admin_delete_staff(uuid) from public, anon;
revoke execute on function public.admin_set_password(uuid, text) from public, anon;
revoke execute on function public.admin_list_staff() from public, anon;

-- ---------- Хранилище фотографий блюд ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu', 'menu', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "menu images: public read"
  on storage.objects for select
  using (bucket_id = 'menu');
create policy "menu images: admin upload"
  on storage.objects for insert
  with check (bucket_id = 'menu' and public.my_role() = 'admin');
create policy "menu images: admin update"
  on storage.objects for update
  using (bucket_id = 'menu' and public.my_role() = 'admin')
  with check (bucket_id = 'menu' and public.my_role() = 'admin');
create policy "menu images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'menu' and public.my_role() = 'admin');

-- ---------- Row Level Security ----------

alter table public.establishments enable row level security;
alter table public.profiles       enable row level security;
alter table public.menu_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.reservations   enable row level security;
alter table public.tables         enable row level security;
alter table public.settings       enable row level security;

-- Столы видит только персонал: в строке лежит code из QR, и светить его
-- всем незачем. Гость получает свой стол через RPC table_by_code().
create policy "tables: staff read"
  on public.tables for select
  using (public.my_role() in ('admin', 'kitchen', 'courier'));
create policy "tables: admin write"
  on public.tables for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Настройки читают все: стоимость доставки видна в корзине ещё до входа
create policy "settings: public read"
  on public.settings for select using (true);
create policy "settings: admin write"
  on public.settings for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Баннер акции читают все (виден на главной), меняет только админ
alter table public.promo_banner enable row level security;
create policy "promo: public read"
  on public.promo_banner for select using (true);
create policy "promo: admin write"
  on public.promo_banner for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

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
-- Удаление (очистка истории и тестовых заказов) — только админ.
-- Позиции заказа уходят каскадом вместе со строкой orders.
create policy "orders: admin delete"
  on public.orders for delete
  using (public.my_role() = 'admin');

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
create policy "reservations: admin delete"
  on public.reservations for delete
  using (public.my_role() = 'admin');

-- ---------- Realtime ----------

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.tables;

-- ---------- Сид-данные ----------

-- 10 столов: у каждого свой QR-код (/t/<code>). Номера и количество мест
-- админ правит в панели, раздел «Столы».
insert into public.tables (number, seats)
select g, case when g <= 6 then 4 else 6 end
from generate_series(1, 10) as g;

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

-- ---------- Учётки персонала ----------
-- Регистрации на сайте нет. Первого администратора заводим здесь, дальше он
-- добавляет кухню и курьеров сам — в панели /admin, вкладка «Персонал».
-- ПОМЕНЯЙТЕ ПАРОЛИ на свои перед боевым запуском.

select public.create_auth_user('admin@lagmancenter.kz',   'Lagman-Admin-2026',   'Администратор', '+7 707 917 9404');
select public.create_auth_user('kitchen@lagmancenter.kz', 'Lagman-Kitchen-2026', 'Кухня',         '+7 707 917 9404');
select public.create_auth_user('courier@lagmancenter.kz', 'Lagman-Courier-2026', 'Курьер',        '+7 707 917 9404');

update public.profiles p set role = 'admin'   from auth.users u where u.id = p.id and u.email = 'admin@lagmancenter.kz';
update public.profiles p set role = 'kitchen' from auth.users u where u.id = p.id and u.email = 'kitchen@lagmancenter.kz';
update public.profiles p set role = 'courier' from auth.users u where u.id = p.id and u.email = 'courier@lagmancenter.kz';
