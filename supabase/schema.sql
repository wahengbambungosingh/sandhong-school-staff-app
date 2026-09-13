-- =============================================================================
-- Sandhong Staff App — database setup (Stage 1: accounts, students, attendance)
--
-- How to apply: open your Supabase project → SQL Editor → New query,
-- paste this whole file, click Run. It is safe to run more than once.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_code   text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  school_id   uuid not null references public.schools (id) on delete cascade,
  full_name   text not null,
  role        text not null default 'teacher'
              check (role in ('principal', 'teacher', 'office_admin', 'technical_admin')),
  created_at  timestamptz not null default now()
);
create index if not exists profiles_school_idx on public.profiles (school_id);

create table if not exists public.students (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools (id) on delete cascade,
  name             text not null,
  admission_no     text not null,
  class            text not null,
  section          text not null default 'A',
  guardian_name    text,
  guardian_phone   text,
  village          text,
  whatsapp_consent boolean not null default false,
  active           boolean not null default true,
  fee_status       text not null default 'Pending' check (fee_status in ('Paid', 'Pending')),
  created_at       timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index if not exists students_school_class_idx on public.students (school_id, class, section);

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('Present', 'Absent', 'Leave', 'Late')),
  marked_by   uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (student_id, date)
);
create index if not exists attendance_school_date_idx on public.attendance (school_id, date);

-- ---------- Helpers ---------------------------------------------------------

-- The school of the signed-in staff member (null when not signed in / no profile).
create or replace function public.current_school_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_staff_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Called right after sign-up by the first person from a school.
-- Creates the school and makes the caller its principal.
create or replace function public.create_school(school_name text, full_name text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  new_school uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a school.';
  end if;
  if length(trim(school_name)) < 2 then
    raise exception 'Please enter the school name.';
  end if;
  insert into public.schools (name) values (trim(school_name)) returning id into new_school;
  insert into public.profiles (id, school_id, full_name, role)
    values (auth.uid(), new_school, trim(full_name), 'principal');
  return new_school;
end;
$$;

-- Called right after sign-up by other staff, using the join code the principal shares.
-- They start as a teacher; the principal can change their role later.
create or replace function public.join_school(code text, full_name text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a school.';
  end if;
  select id into target from public.schools where join_code = upper(trim(code));
  if target is null then
    raise exception 'That join code was not found. Check it with your principal.';
  end if;
  insert into public.profiles (id, school_id, full_name, role)
    values (auth.uid(), target, trim(full_name), 'teacher');
  return target;
end;
$$;

-- Students who need a follow-up: 3+ absences in the last 7 days, or 7+ in the last 30.
create or replace view public.followup_students
with (security_invoker = true) as
select
  s.id,
  s.school_id,
  s.name,
  s.class,
  s.section,
  count(*) filter (where a.status = 'Absent' and a.date >= current_date - 6)  as absent_last_7,
  count(*) filter (where a.status = 'Absent' and a.date >= current_date - 29) as absent_last_30,
  array_remove(array_agg(a.date order by a.date desc) filter (where a.status = 'Absent'), null) as absent_dates
from public.students s
left join public.attendance a
  on a.student_id = s.id and a.date >= current_date - 29
where s.active
group by s.id
having count(*) filter (where a.status = 'Absent' and a.date >= current_date - 6)  >= 3
    or count(*) filter (where a.status = 'Absent' and a.date >= current_date - 29) >= 7;

-- ---------- Row-level security: each school sees only its own data --------

alter table public.schools    enable row level security;
alter table public.profiles   enable row level security;
alter table public.students   enable row level security;
alter table public.attendance enable row level security;

drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools
  for select to authenticated using (id = public.current_school_id());

drop policy if exists schools_update on public.schools;
create policy schools_update on public.schools
  for update to authenticated
  using (id = public.current_school_id() and public.current_staff_role() = 'principal');

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (school_id = public.current_school_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_by_principal on public.profiles;
create policy profiles_update_by_principal on public.profiles
  for update to authenticated
  using (school_id = public.current_school_id() and public.current_staff_role() = 'principal')
  with check (school_id = public.current_school_id());

drop policy if exists students_all on public.students;
create policy students_all on public.students
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- Nobody outside a signed-in session can call the helpers.
revoke execute on function public.create_school(text, text) from anon;
revoke execute on function public.join_school(text, text) from anon;

-- ---------- Access grants (Supabase usually adds these; explicit is safer) --

grant usage on schema public to authenticated;
grant select, update on public.schools to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select on public.followup_students to authenticated;
grant execute on function public.current_school_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.create_school(text, text) to authenticated;
grant execute on function public.join_school(text, text) to authenticated;

-- =============================================================================
-- Stage 2a: School issues with photos
-- =============================================================================

create table if not exists public.issues (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools (id) on delete cascade,
  category     text not null,
  description  text not null,
  priority     text not null default 'Low' check (priority in ('Low', 'Medium', 'High')),
  status       text not null default 'Open' check (status in ('Open', 'In Progress', 'Resolved')),
  photo_path   text,
  reported_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists issues_school_created_idx on public.issues (school_id, created_at desc);

alter table public.issues enable row level security;

drop policy if exists issues_all on public.issues;
create policy issues_all on public.issues
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.issues to authenticated;

-- Private photo bucket. Files are stored under <school_id>/<file>, and the
-- policies below only let staff touch files inside their own school's folder.
insert into storage.buckets (id, name, public)
  values ('issue-photos', 'issue-photos', false)
  on conflict (id) do nothing;

drop policy if exists issue_photos_select on storage.objects;
create policy issue_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = public.current_school_id()::text);

drop policy if exists issue_photos_insert on storage.objects;
create policy issue_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = public.current_school_id()::text);

drop policy if exists issue_photos_delete on storage.objects;
create policy issue_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = public.current_school_id()::text);
