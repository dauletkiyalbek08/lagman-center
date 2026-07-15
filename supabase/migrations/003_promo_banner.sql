-- ============================================================
-- Миграция 003: рекламный баннер на главной (акция / праздник / комбо).
-- Админ включает/выключает и меняет его в панели, клиент видит на главной.
--
-- Как применить: Supabase → SQL Editor → New query → вставить целиком → Run.
-- Скрипт идемпотентный: повторный запуск ничего не сломает.
-- ============================================================

-- ---------- 1. Таблица баннера. Одна строка: id всегда = 1 ----------
create table if not exists public.promo_banner (
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

-- гарантируем, что строка с id = 1 существует (первый запуск)
insert into public.promo_banner (id) values (1)
on conflict (id) do nothing;

-- ---------- 2. Обновление updated_at ----------
drop trigger if exists promo_banner_updated_at on public.promo_banner;
create trigger promo_banner_updated_at
  before update on public.promo_banner
  for each row execute function public.set_updated_at();

-- ---------- 3. Доступ: читают все, меняет только админ ----------
alter table public.promo_banner enable row level security;

drop policy if exists "promo: public read" on public.promo_banner;
create policy "promo: public read"
  on public.promo_banner for select using (true);

drop policy if exists "promo: admin write" on public.promo_banner;
create policy "promo: admin write"
  on public.promo_banner for all
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');
