-- ============================================================
-- Миграция 002: самовывоз, оценки заказов, статистика курьеров,
-- удаление заказов и броней (для теста).
--
-- Как применить: Supabase → SQL Editor → New query → вставить целиком → Run.
-- Скрипт идемпотентный: повторный запуск ничего не сломает.
-- ============================================================

-- ---------- 1. Самовывоз как третий тип заказа ----------
alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check
  check (order_type in ('delivery', 'dine_in', 'pickup'));

-- ---------- 2. Оценка заказа (звёзды + комментарий) ----------
-- Для доставки это оценка курьера, для зала/самовывоза — оценка заведения.
alter table public.orders
  add column if not exists rating int check (rating between 1 and 5),
  add column if not exists review_comment text,
  add column if not exists rated_at timestamptz;

-- ---------- 3. create_order: + самовывоз ----------
-- Самовывоз, как и доставка, только для вошедшего клиента (так решили):
-- заказ привязан к контакту, а забирает человек сам — адрес и курьер не нужны,
-- доставка не считается, оплата на кассе при получении.
create or replace function public.create_order(
  p_order_type text,
  p_table_code text,
  p_address text,
  p_phone text,
  p_customer_name text,
  p_payment_method text,
  p_comment text,
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
    -- доставка: только для вошедшего клиента, адрес обязателен, + стоимость доставки
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

grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;

-- ---------- 4. Оценка заказа: клиент ставит звёзды по id заказа ----------
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

grant execute on function public.rate_order(uuid, int, text) to anon, authenticated;

-- ---------- 5. Удаление заказов и броней (для теста и очистки истории) ----------
-- Удалять может только админ. Позиции заказа уходят каскадом вместе с заказом.
drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete"
  on public.orders for delete
  using (public.my_role() = 'admin');

drop policy if exists "reservations: admin delete" on public.reservations;
create policy "reservations: admin delete"
  on public.reservations for delete
  using (public.my_role() = 'admin');
