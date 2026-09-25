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

-- Absence counts for every active student over the last 30 days.
-- needs_followup is true for 3+ absences in the last 7 days, or 7+ in the last 30.
drop view if exists public.followup_students;
create view public.followup_students
with (security_invoker = true) as
select
  s.id,
  s.school_id,
  s.name,
  s.class,
  s.section,
  count(*) filter (where a.status = 'Absent' and a.date >= current_date - 6)  as absent_last_7,
  count(*) filter (where a.status = 'Absent' and a.date >= current_date - 29) as absent_last_30,
  array_remove(array_agg(a.date order by a.date desc) filter (where a.status = 'Absent'), null) as absent_dates,
  (count(*) filter (where a.status = 'Absent' and a.date >= current_date - 6)  >= 3
   or count(*) filter (where a.status = 'Absent' and a.date >= current_date - 29) >= 7) as needs_followup
from public.students s
left join public.attendance a
  on a.student_id = s.id and a.date >= current_date - 29
where s.active
group by s.id;

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

-- =============================================================================
-- Stage 2b: staff management, school setup, assignments, contact log,
--           homework, assessments and marks
-- =============================================================================

-- ---------- School settings (editable by the principal) --------------------

alter table public.schools add column if not exists academic_year text not null default '2026–2027';
alter table public.schools add column if not exists classes text[] not null
  default array['Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8'];
alter table public.schools add column if not exists sections text[] not null default array['A','B'];
alter table public.schools add column if not exists subjects text[] not null
  default array['English','Kannada','Mathematics','EVS','Science','Social Science'];

-- ---------- Staff: email on profiles, role changes, removal ---------------

alter table public.profiles add column if not exists email text;

-- Fill in emails for accounts created before this column existed.
update public.profiles p set email = u.email
  from auth.users u where u.id = p.id and p.email is null;

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
  insert into public.profiles (id, school_id, full_name, role, email)
    values (auth.uid(), new_school, trim(full_name), 'principal', auth.jwt() ->> 'email');
  return new_school;
end;
$$;

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
  insert into public.profiles (id, school_id, full_name, role, email)
    values (auth.uid(), target, trim(full_name), 'teacher', auth.jwt() ->> 'email');
  return target;
end;
$$;

-- Principal changes a colleague's role.
create or replace function public.set_staff_role(target uuid, new_role text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if public.current_staff_role() <> 'principal' then
    raise exception 'Only the principal can change roles.';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  if new_role not in ('principal', 'teacher', 'office_admin', 'technical_admin') then
    raise exception 'Unknown role.';
  end if;
  update public.profiles set role = new_role
    where id = target and school_id = public.current_school_id();
  if not found then
    raise exception 'Staff member not found in your school.';
  end if;
end;
$$;

-- Principal removes a colleague from the school. Their sign-in still exists;
-- they can join another school with a code.
create or replace function public.remove_staff(target uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if public.current_staff_role() <> 'principal' then
    raise exception 'Only the principal can remove staff.';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot remove yourself.';
  end if;
  delete from public.profiles where id = target and school_id = public.current_school_id();
  if not found then
    raise exception 'Staff member not found in your school.';
  end if;
end;
$$;

-- Principal issues a fresh join code (the old one stops working).
create or replace function public.regenerate_join_code()
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if public.current_staff_role() <> 'principal' then
    raise exception 'Only the principal can change the join code.';
  end if;
  new_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  update public.schools set join_code = new_code where id = public.current_school_id();
  return new_code;
end;
$$;

revoke execute on function public.set_staff_role(uuid, text) from anon;
revoke execute on function public.remove_staff(uuid) from anon;
revoke execute on function public.regenerate_join_code() from anon;
grant execute on function public.set_staff_role(uuid, text) to authenticated;
grant execute on function public.remove_staff(uuid) to authenticated;
grant execute on function public.regenerate_join_code() to authenticated;

-- ---------- Teacher assignments -------------------------------------------

create table if not exists public.teacher_assignments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  class       text not null,
  section     text not null,
  subject     text not null,
  created_at  timestamptz not null default now(),
  unique (profile_id, class, section, subject)
);
create index if not exists teacher_assignments_school_idx on public.teacher_assignments (school_id);
alter table public.teacher_assignments enable row level security;

drop policy if exists teacher_assignments_select on public.teacher_assignments;
create policy teacher_assignments_select on public.teacher_assignments
  for select to authenticated using (school_id = public.current_school_id());

drop policy if exists teacher_assignments_manage on public.teacher_assignments;
create policy teacher_assignments_manage on public.teacher_assignments
  for all to authenticated
  using (school_id = public.current_school_id()
         and public.current_staff_role() in ('principal', 'office_admin', 'technical_admin'))
  with check (school_id = public.current_school_id()
         and public.current_staff_role() in ('principal', 'office_admin', 'technical_admin'));

grant select, insert, update, delete on public.teacher_assignments to authenticated;

-- ---------- Parent contact log --------------------------------------------

create table if not exists public.contact_logs (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  type        text not null check (type in ('WhatsApp opened', 'Phone call', 'Meeting requested', 'Home visit', 'No response')),
  outcome     text not null,
  note        text,
  logged_by   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists contact_logs_school_created_idx on public.contact_logs (school_id, created_at desc);
alter table public.contact_logs enable row level security;

drop policy if exists contact_logs_all on public.contact_logs;
create policy contact_logs_all on public.contact_logs
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.contact_logs to authenticated;

-- ---------- Homework ------------------------------------------------------

create table if not exists public.homework (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  class       text not null,
  section     text not null,
  subject     text not null,
  text        text not null,
  due_date    date,
  set_by      uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists homework_school_created_idx on public.homework (school_id, created_at desc);
alter table public.homework enable row level security;

drop policy if exists homework_all on public.homework;
create policy homework_all on public.homework
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.homework to authenticated;

-- ---------- Assessments and marks -----------------------------------------

create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  title       text not null,
  class       text not null,
  section     text not null,
  subject     text not null,
  date        date not null default current_date,
  max_marks   numeric(6,2) not null check (max_marks > 0),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists assessments_school_date_idx on public.assessments (school_id, date desc);
alter table public.assessments enable row level security;

drop policy if exists assessments_all on public.assessments;
create policy assessments_all on public.assessments
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create table if not exists public.marks (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete cascade,
  assessment_id  uuid not null references public.assessments (id) on delete cascade,
  student_id     uuid not null references public.students (id) on delete cascade,
  marks          numeric(6,2) check (marks >= 0),
  updated_at     timestamptz not null default now(),
  unique (assessment_id, student_id)
);
alter table public.marks enable row level security;

drop policy if exists marks_all on public.marks;
create policy marks_all on public.marks
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.marks to authenticated;

-- =============================================================================
-- Stage 2c: homework attachments (photo or PDF)
-- =============================================================================

alter table public.homework add column if not exists attachment_path text;
alter table public.homework add column if not exists attachment_name text;
alter table public.homework add column if not exists attachment_type text;

insert into storage.buckets (id, name, public)
  values ('homework-files', 'homework-files', false)
  on conflict (id) do nothing;

drop policy if exists homework_files_select on storage.objects;
create policy homework_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'homework-files' and (storage.foldername(name))[1] = public.current_school_id()::text);

drop policy if exists homework_files_insert on storage.objects;
create policy homework_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'homework-files' and (storage.foldername(name))[1] = public.current_school_id()::text);

drop policy if exists homework_files_delete on storage.objects;
create policy homework_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'homework-files' and (storage.foldername(name))[1] = public.current_school_id()::text);

-- =============================================================================
-- Stage 3: parent access (read-only), correction requests, admission enquiries
--
-- Parents sign in anonymously (enable "Allow anonymous sign-ins" under
-- Authentication → Providers in the Supabase dashboard) and link each child
-- with the child's parent code plus the guardian phone number on file.
-- =============================================================================

-- ---------- Parent codes on students ---------------------------------------

alter table public.students add column if not exists parent_code text;
update public.students set parent_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)) where parent_code is null;
alter table public.students alter column parent_code set default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
alter table public.students alter column parent_code set not null;
create unique index if not exists students_parent_code_idx on public.students (parent_code);

-- ---------- Parent ↔ child links -------------------------------------------

create table if not exists public.parent_links (
  user_id     uuid not null references auth.users (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  phone       text,
  created_at  timestamptz not null default now(),
  primary key (user_id, student_id)
);
alter table public.parent_links enable row level security;

drop policy if exists parent_links_own on public.parent_links;
create policy parent_links_own on public.parent_links
  for select to authenticated using (user_id = auth.uid());

drop policy if exists parent_links_delete_own on public.parent_links;
create policy parent_links_delete_own on public.parent_links
  for delete to authenticated using (user_id = auth.uid());

grant select, delete on public.parent_links to authenticated;

create or replace function public.is_parent_of(student uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.parent_links where user_id = auth.uid() and student_id = student);
$$;

-- Class/section pairs (per school) of the caller's linked children.
create or replace function public.parent_has_class(p_school uuid, p_class text, p_section text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_links l
    join public.students s on s.id = l.student_id
    where l.user_id = auth.uid() and s.school_id = p_school and s.class = p_class and s.section = p_section
  );
$$;

-- Parent links a child: code must match, and the phone must match the
-- guardian phone on file when the school has recorded one.
create or replace function public.link_child(code text, phone text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  st public.students%rowtype;
  digits text := right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10);
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Staff accounts cannot be used as parent accounts.';
  end if;
  if length(digits) < 10 then
    raise exception 'Please enter a 10-digit mobile number.';
  end if;
  select * into st from public.students where parent_code = upper(trim(code));
  if st.id is null then
    raise exception 'That child code was not found. Check it with the school.';
  end if;
  if st.guardian_phone is not null and right(regexp_replace(st.guardian_phone, '\D', '', 'g'), 10) <> digits then
    raise exception 'That phone number does not match the guardian number the school has on file.';
  end if;
  insert into public.parent_links (user_id, student_id, phone) values (auth.uid(), st.id, digits)
    on conflict (user_id, student_id) do nothing;
  return st.id;
end;
$$;

-- Staff issues a new parent code for a student (old code stops working,
-- existing parent links stay).
create or replace function public.regenerate_parent_code(student uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  new_code text := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
begin
  if public.current_school_id() is null then
    raise exception 'Only school staff can do this.';
  end if;
  update public.students set parent_code = new_code where id = student and school_id = public.current_school_id();
  if not found then
    raise exception 'Student not found in your school.';
  end if;
  return new_code;
end;
$$;

revoke execute on function public.link_child(text, text) from anon;
revoke execute on function public.regenerate_parent_code(uuid) from anon;
grant execute on function public.link_child(text, text) to authenticated;
grant execute on function public.regenerate_parent_code(uuid) to authenticated;
grant execute on function public.is_parent_of(uuid) to authenticated;
grant execute on function public.parent_has_class(uuid, text, text) to authenticated;

-- Parents (anonymous accounts) must not create or join schools.
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
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Parent accounts cannot set up a school.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a school.';
  end if;
  if length(trim(school_name)) < 2 then
    raise exception 'Please enter the school name.';
  end if;
  insert into public.schools (name) values (trim(school_name)) returning id into new_school;
  insert into public.profiles (id, school_id, full_name, role, email)
    values (auth.uid(), new_school, trim(full_name), 'principal', auth.jwt() ->> 'email');
  return new_school;
end;
$$;

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
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Parent accounts cannot join a school as staff.';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a school.';
  end if;
  select id into target from public.schools where join_code = upper(trim(code));
  if target is null then
    raise exception 'That join code was not found. Check it with your principal.';
  end if;
  insert into public.profiles (id, school_id, full_name, role, email)
    values (auth.uid(), target, trim(full_name), 'teacher', auth.jwt() ->> 'email');
  return target;
end;
$$;

-- ---------- What parents may read --------------------------------------------

drop policy if exists students_parent_select on public.students;
create policy students_parent_select on public.students
  for select to authenticated using (public.is_parent_of(id));

drop policy if exists schools_parent_select on public.schools;
create policy schools_parent_select on public.schools
  for select to authenticated
  using (exists (select 1 from public.parent_links l join public.students s on s.id = l.student_id
                 where l.user_id = auth.uid() and s.school_id = schools.id));

drop policy if exists attendance_parent_select on public.attendance;
create policy attendance_parent_select on public.attendance
  for select to authenticated using (public.is_parent_of(student_id));

drop policy if exists homework_parent_select on public.homework;
create policy homework_parent_select on public.homework
  for select to authenticated using (public.parent_has_class(school_id, class, section));

drop policy if exists assessments_parent_select on public.assessments;
create policy assessments_parent_select on public.assessments
  for select to authenticated using (public.parent_has_class(school_id, class, section));

drop policy if exists marks_parent_select on public.marks;
create policy marks_parent_select on public.marks
  for select to authenticated using (public.is_parent_of(student_id));

drop policy if exists homework_files_parent_select on storage.objects;
create policy homework_files_parent_select on storage.objects
  for select to authenticated
  using (bucket_id = 'homework-files' and exists (
    select 1 from public.parent_links l join public.students s on s.id = l.student_id
    where l.user_id = auth.uid() and s.school_id::text = (storage.foldername(objects.name))[1]));

-- ---------- Correction requests from parents ---------------------------------

create table if not exists public.correction_requests (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  message     text not null,
  status      text not null default 'New' check (status in ('New', 'Done')),
  created_at  timestamptz not null default now()
);
create index if not exists correction_requests_school_idx on public.correction_requests (school_id, status, created_at desc);
alter table public.correction_requests enable row level security;

drop policy if exists correction_requests_parent_insert on public.correction_requests;
create policy correction_requests_parent_insert on public.correction_requests
  for insert to authenticated with check (public.is_parent_of(student_id) and user_id = auth.uid());

drop policy if exists correction_requests_parent_select on public.correction_requests;
create policy correction_requests_parent_select on public.correction_requests
  for select to authenticated using (user_id = auth.uid());

drop policy if exists correction_requests_staff on public.correction_requests;
create policy correction_requests_staff on public.correction_requests
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant select, insert, update, delete on public.correction_requests to authenticated;

-- ---------- Admission enquiries (public form, no login) ----------------------

create table if not exists public.admission_enquiries (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools (id) on delete cascade,
  child_name    text not null,
  child_age     text,
  class_wanted  text,
  parent_name   text not null,
  phone         text not null,
  note          text,
  status        text not null default 'New' check (status in ('New', 'Called', 'Admitted', 'Closed')),
  created_at    timestamptz not null default now()
);
create index if not exists admission_enquiries_school_idx on public.admission_enquiries (school_id, status, created_at desc);
alter table public.admission_enquiries enable row level security;

drop policy if exists admission_enquiries_public_insert on public.admission_enquiries;
create policy admission_enquiries_public_insert on public.admission_enquiries
  for insert to anon, authenticated
  with check (length(trim(child_name)) >= 2 and length(regexp_replace(phone, '\D', '', 'g')) >= 10);

drop policy if exists admission_enquiries_staff on public.admission_enquiries;
create policy admission_enquiries_staff on public.admission_enquiries
  for all to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

grant insert on public.admission_enquiries to anon;
grant select, insert, update, delete on public.admission_enquiries to authenticated;

-- The public enquiry form only needs the school's name for the given id.
create or replace function public.school_name_for_enquiry(p_school uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select name from public.schools where id = p_school;
$$;
grant execute on function public.school_name_for_enquiry(uuid) to anon, authenticated;
