create extension if not exists pgcrypto;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  first_name text not null,
  last_name text not null,
  email text,
  contact_number text not null,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  quantity int not null check (quantity between 1 and 20),
  unit_price int not null,
  total int not null,
  payment_method text not null check (payment_method in ('gcash', 'bpi')),
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

-- RLS on with no policies: only the service-role key (server) can read/write.
alter table public.customers enable row level security;
alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
