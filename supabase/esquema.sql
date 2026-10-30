-- Base de datos de reseñas de Los Sonorenses Parrilla.
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Antes de correrlo cambia el correo de la última línea por el del encargado.

create table if not exists public.resenas (
  id           bigint generated always as identity primary key,
  creada_en    timestamptz not null default now(),
  calificacion smallint not null check (calificacion between 1 and 5),
  comentario   text check (char_length(comentario) <= 2000),
  categorias   text[] not null default '{}' check (cardinality(categorias) <= 20),
  detalles     text[] not null default '{}' check (cardinality(detalles) <= 60),
  mesero       text check (char_length(mesero) <= 100),
  nombre       text check (char_length(nombre) <= 100),
  contacto     text check (char_length(contacto) <= 100),
  atendida     boolean not null default false,
  nota_interna text check (char_length(nota_interna) <= 1000)
);

-- Para quien ya había creado la tabla con la versión anterior.
alter table public.resenas
  add column if not exists detalles text[] not null default '{}' check (cardinality(detalles) <= 60);

create index if not exists resenas_creada_en_idx on public.resenas (creada_en desc);

-- Correos del personal que puede ver el panel.
create table if not exists public.staff (
  email text primary key
);

alter table public.resenas enable row level security;
alter table public.staff enable row level security;

create or replace function public.es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Los clientes (sin sesión) solo pueden ENVIAR reseñas nuevas; no pueden leerlas.
drop policy if exists "clientes envian resenas" on public.resenas;
create policy "clientes envian resenas" on public.resenas
  for insert to anon, authenticated
  with check (atendida = false and nota_interna is null);

-- Solo el personal registrado en "staff" puede leer y actualizar.
drop policy if exists "staff lee resenas" on public.resenas;
create policy "staff lee resenas" on public.resenas
  for select to authenticated
  using (public.es_staff());

drop policy if exists "staff actualiza resenas" on public.resenas;
create policy "staff actualiza resenas" on public.resenas
  for update to authenticated
  using (public.es_staff())
  with check (public.es_staff());

-- Los clientes no pueden cambiar la fecha ni marcar su reseña como atendida.
revoke insert on public.resenas from anon, authenticated;
grant insert (calificacion, comentario, categorias, detalles, mesero, nombre, contacto)
  on public.resenas to anon, authenticated;
-- El personal solo cambia el estado y la nota, nunca lo que escribió el cliente.
revoke update on public.resenas from anon, authenticated;
grant update (atendida, nota_interna) on public.resenas to authenticated;

-- ⬇️ Cambia este correo por el del dueño o gerente (puedes repetir la línea para más personas).
insert into public.staff (email) values ('cambia-este-correo@ejemplo.com') on conflict do nothing;
