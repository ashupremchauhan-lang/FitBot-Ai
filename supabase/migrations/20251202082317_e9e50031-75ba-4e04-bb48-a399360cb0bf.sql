-- Create profiles table for user data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create fitness_plans table for history tracking
create table public.fitness_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  age integer,
  gender text,
  height numeric,
  weight numeric,
  activity_level text,
  goal text,
  diet_preferences text[], -- Array to store multiple preferences
  equipment text,
  bmi numeric,
  bmi_category text,
  exercises jsonb,
  diet_plan jsonb,
  notes jsonb,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.fitness_plans enable row level security;

-- Fitness plans policies
create policy "Users can view own plans"
  on public.fitness_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.fitness_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on public.fitness_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on public.fitness_plans for delete
  using (auth.uid() = user_id);

-- Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger to profiles
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();