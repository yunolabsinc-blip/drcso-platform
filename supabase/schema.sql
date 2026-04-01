-- ============================================================
-- DrCSO Platform - Supabase Schema
-- CSO(Contract Sales Organization) 플랫폼 DB 스키마
-- ============================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. users (회원 - CSO딜러 / 제약사 / 관리자)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role text not null check (role in ('cso', 'pharma', 'admin')),
  company_id uuid,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. companies (제약사 / 공급사 정보)
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business_number text unique,        -- 사업자등록번호
  representative text,                -- 대표자
  address text,
  phone text,
  type text not null check (type in ('pharma', 'supplier')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- users.company_id FK
alter table public.users
  add constraint fk_users_company
  foreign key (company_id) references public.companies(id);

-- 3. products (제품 목록)
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  name text not null,                  -- 제품명
  generic_name text,                   -- 성분명 (주성분)
  category text,                       -- 약효분류
  department text,                     -- 진료과목
  base_price integer default 0,        -- 기준가 (원)
  commission_rate numeric(5,2) default 0, -- 수수료율 (%)
  commission_amount integer default 0, -- 수수료 (원)
  description text,
  sale_status text default 'on_sale' check (sale_status in ('on_sale', 'discontinued', 'pending')),
  is_tradeable boolean default true,   -- 거래가능여부
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. customers (거래처: 병원/약국/기타)
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),  -- 등록한 CSO딜러
  name text not null,                  -- 거래처명
  type text not null check (type in ('hospital', 'pharmacy', 'other')),
  address text,
  phone text,
  contact_person text,                 -- 담당자
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. transactions (거래 요청 현황)
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),       -- 요청한 CSO딜러
  product_id uuid not null references public.products(id),
  customer_id uuid not null references public.customers(id),
  status text default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
  quantity integer default 1,
  notes text,
  reviewed_by uuid references public.users(id),            -- 확인한 제약사 담당자
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. edi_records (EDI 실적 데이터)
create table public.edi_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),       -- CSO딜러
  product_id uuid not null references public.products(id),
  customer_id uuid references public.customers(id),
  edi_date date not null,              -- 실적 일자
  quantity integer default 0,
  amount integer default 0,            -- 금액
  commission integer default 0,        -- 수수료
  file_url text,                       -- 업로드된 EDI 파일 URL
  created_at timestamptz default now()
);

-- 7. favorites (관심 제품 찜하기)
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  product_id uuid not null references public.products(id),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================================
-- Updated_at 자동 갱신 트리거
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users
  for each row execute function update_updated_at();
create trigger trg_companies_updated_at before update on public.companies
  for each row execute function update_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute function update_updated_at();
create trigger trg_customers_updated_at before update on public.customers
  for each row execute function update_updated_at();
create trigger trg_transactions_updated_at before update on public.transactions
  for each row execute function update_updated_at();

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.edi_records enable row level security;
alter table public.favorites enable row level security;

-- Helper: 현재 사용자의 role 가져오기
create or replace function public.get_user_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

-- ----- users -----
create policy "Users can view own profile"
  on public.users for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.users for update using (id = auth.uid());

create policy "Admin can view all users"
  on public.users for select using (public.get_user_role() = 'admin');

create policy "Allow insert during signup"
  on public.users for insert with check (id = auth.uid());

-- ----- companies -----
create policy "Anyone authenticated can view companies"
  on public.companies for select using (auth.uid() is not null);

create policy "Admin can manage companies"
  on public.companies for all using (public.get_user_role() = 'admin');

create policy "Pharma can manage own company"
  on public.companies for update using (
    id in (select company_id from public.users where id = auth.uid())
  );

-- ----- products -----
create policy "Anyone authenticated can view products"
  on public.products for select using (auth.uid() is not null);

create policy "Pharma can manage own products"
  on public.products for all using (
    company_id in (select company_id from public.users where id = auth.uid() and role = 'pharma')
  );

create policy "Admin can manage all products"
  on public.products for all using (public.get_user_role() = 'admin');

-- ----- customers -----
create policy "CSO can view own customers"
  on public.customers for select using (user_id = auth.uid());

create policy "CSO can manage own customers"
  on public.customers for all using (user_id = auth.uid());

create policy "Admin can view all customers"
  on public.customers for select using (public.get_user_role() = 'admin');

-- ----- transactions -----
create policy "CSO can view own transactions"
  on public.transactions for select using (user_id = auth.uid());

create policy "CSO can create transactions"
  on public.transactions for insert with check (user_id = auth.uid());

create policy "Pharma can view related transactions"
  on public.transactions for select using (
    product_id in (
      select p.id from public.products p
      join public.users u on u.company_id = p.company_id
      where u.id = auth.uid() and u.role = 'pharma'
    )
  );

create policy "Pharma can update transaction status"
  on public.transactions for update using (
    product_id in (
      select p.id from public.products p
      join public.users u on u.company_id = p.company_id
      where u.id = auth.uid() and u.role = 'pharma'
    )
  );

create policy "Admin can manage all transactions"
  on public.transactions for all using (public.get_user_role() = 'admin');

-- ----- edi_records -----
create policy "CSO can view own EDI records"
  on public.edi_records for select using (user_id = auth.uid());

create policy "CSO can insert own EDI records"
  on public.edi_records for insert with check (user_id = auth.uid());

create policy "Admin can manage all EDI records"
  on public.edi_records for all using (public.get_user_role() = 'admin');

-- ----- favorites -----
create policy "Users can manage own favorites"
  on public.favorites for all using (user_id = auth.uid());
