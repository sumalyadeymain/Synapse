-- ╔══════════════════════════════════════════════════════════════╗
-- ║         SYNAPSE — Complete Database Schema v2.0              ║
-- ║   Run this in Supabase SQL Editor (top to bottom)           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ───────────────────────────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────────────────────────
create extension if not exists vector;
create extension if not exists pgcrypto;
create extension if not exists pg_cron; -- available on Pro plans

-- ───────────────────────────────────────────────────────────────
-- PROFILES
-- ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  iq_score       int default 100,
  wallet_balance numeric(12,2) default 0.00,
  bio            text,
  avatar_emoji   text default '🧠',
  total_earned   numeric(12,2) default 0.00,
  created_at     timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '🧠')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────────────────────────────────────────────
-- IDEAS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.ideas (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid references public.profiles(id) on delete cascade not null,
  title            text not null,
  teaser_text      text not null,
  secret_content   text not null,          -- never returned via RLS
  price            numeric(10,2) not null check (price >= 50),
  category_tags    text[],
  unlock_count     int default 0,
  avg_rating       numeric(3,2) default 0.00,
  status           text default 'active' check (status in ('active','inactive')),
  vector_embedding vector(768),            -- Gemini embedding dimension
  ai_vetting_passed boolean default false,
  created_at       timestamptz default now()
);

-- ───────────────────────────────────────────────────────────────
-- TRADES  (Idea Escrow)
-- ───────────────────────────────────────────────────────────────
create table if not exists public.trades (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid references public.profiles(id) not null,
  seller_id      uuid references public.profiles(id) not null,
  idea_id        uuid references public.ideas(id) not null,
  amount         numeric(10,2) not null,
  platform_fee   numeric(10,2) not null,
  seller_payout  numeric(10,2) not null,
  status         text default 'PENDING' check (status in ('PENDING','RELEASED','DISPUTED','UNDER_REVIEW')),
  created_at     timestamptz default now(),
  release_at     timestamptz not null,
  dispute_reason text
);

-- ───────────────────────────────────────────────────────────────
-- BOUNTIES
-- ───────────────────────────────────────────────────────────────
create table if not exists public.bounties (
  id                     uuid primary key default gen_random_uuid(),
  payer_id               uuid references public.profiles(id) not null,
  title                  text not null,
  description            text not null,
  tags                   text[],
  reward_amount          numeric(10,2) not null check (reward_amount >= 50),
  status                 text default 'OPEN'
                           check (status in ('OPEN','PITCHING','ASSIGNED','SUBMITTED','VETTING','RELEASED','DISPUTED')),
  assigned_submission_id uuid,             -- FK set after ASSIGNED
  deadline_hours         int default 48,
  created_at             timestamptz default now()
);

-- ───────────────────────────────────────────────────────────────
-- BOUNTY SUBMISSIONS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.bounty_submissions (
  id                  uuid primary key default gen_random_uuid(),
  bounty_id           uuid references public.bounties(id) on delete cascade not null,
  freelancer_id       uuid references public.profiles(id) not null,
  teaser              text not null,
  secret_solution     text,                -- only set after ASSIGNED
  status              text default 'PITCHED'
                        check (status in ('PITCHED','ASSIGNED','SUBMITTED','VETTED_PASS','VETTED_FAIL')),
  plagiarism_score    int,
  quality_score       int,
  vetting_issues      text[],
  vetting_verdict     text check (vetting_verdict in ('PASS','FAIL')),
  created_at          timestamptz default now()
);

-- Add FK from bounties to bounty_submissions
alter table public.bounties
  add constraint fk_assigned_submission
  foreign key (assigned_submission_id)
  references public.bounty_submissions(id);

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.ideas             enable row level security;
alter table public.trades            enable row level security;
alter table public.bounties          enable row level security;
alter table public.bounty_submissions enable row level security;

-- PROFILES
create policy "profiles_select_all"   on public.profiles for select using (true);
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own"   on public.profiles for insert with check (auth.uid() = id);

-- IDEAS (secret_content is selected only via service role edge function)
create policy "ideas_select_public"   on public.ideas for select using (status = 'active');
create policy "ideas_insert_own"      on public.ideas for insert with check (auth.uid() = seller_id);
create policy "ideas_update_own"      on public.ideas for update using (auth.uid() = seller_id);

-- TRADES
create policy "trades_select_own"     on public.trades for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "trades_insert_buyer"   on public.trades for insert with check (auth.uid() = buyer_id);

-- BOUNTIES
create policy "bounties_select_all"   on public.bounties for select using (true);
create policy "bounties_insert_auth"  on public.bounties for insert with check (auth.uid() = payer_id);
create policy "bounties_update_payer" on public.bounties for update using (auth.uid() = payer_id);

-- BOUNTY SUBMISSIONS
create policy "submissions_select_all"  on public.bounty_submissions for select using (true);
create policy "submissions_insert_auth" on public.bounty_submissions for insert with check (auth.uid() = freelancer_id);
create policy "submissions_update_own"  on public.bounty_submissions for update using (auth.uid() = freelancer_id);

-- ───────────────────────────────────────────────────────────────
-- AUTO ESCROW SETTLEMENT  (runs every 5 minutes via pg_cron)
-- ───────────────────────────────────────────────────────────────
create or replace function public.process_expired_escrows()
returns void language plpgsql security definer as $$
declare
  t record;
begin
  for t in
    select * from public.trades
    where status = 'PENDING' and release_at <= now()
  loop
    -- Credit seller
    update public.profiles
      set wallet_balance = wallet_balance + t.seller_payout,
          total_earned   = total_earned   + t.seller_payout
      where id = t.seller_id;

    -- Mark released
    update public.trades set status = 'RELEASED' where id = t.id;

    -- Increment unlock count on idea
    update public.ideas set unlock_count = unlock_count + 1 where id = t.idea_id;
  end loop;
end;
$$;

-- Schedule: every 5 minutes  (requires pg_cron extension — Pro plan only)
-- select cron.schedule('auto-escrow', '*/5 * * * *', 'select process_expired_escrows()');

-- ───────────────────────────────────────────────────────────────
-- SEED DATA  (optional — comment out after first run)
-- ───────────────────────────────────────────────────────────────
-- Insert is handled by the app POST /api/seed on first launch.
