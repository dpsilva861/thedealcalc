-- Learned Rules table for the Lease Redline Agent's self-learning system.
-- Stores rules derived from user feedback (accept/reject decisions, chat corrections)
-- so the agent improves over time.

create table if not exists public.learned_rules (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('avoid', 'prefer', 'correct', 'enforce')),
  category text not null,
  trigger text not null,
  instruction text not null,
  confidence numeric not null default 0.5,
  occurrences integer not null default 1,
  created_at timestamptz not null default now(),
  last_triggered timestamptz not null default now()
);

-- Index for fast lookup by user
create index if not exists idx_learned_rules_user_id on public.learned_rules(user_id);

-- RLS policies
alter table public.learned_rules enable row level security;

create policy "Users can read their own learned rules"
  on public.learned_rules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own learned rules"
  on public.learned_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own learned rules"
  on public.learned_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own learned rules"
  on public.learned_rules for delete
  using (auth.uid() = user_id);

-- Feedback signals buffer for pattern analysis
create table if not exists public.feedback_signals (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null,
  category text,
  clause_number integer,
  risk_level text,
  detail text,
  original_instruction text,
  user_correction text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_signals_user_id on public.feedback_signals(user_id);

-- Keep only last 500 signals per user (cleanup function)
create or replace function public.cleanup_old_feedback_signals()
returns trigger as $$
begin
  delete from public.feedback_signals
  where user_id = NEW.user_id
    and id not in (
      select id from public.feedback_signals
      where user_id = NEW.user_id
      order by created_at desc
      limit 500
    );
  return NEW;
end;
$$ language plpgsql;

create trigger trg_cleanup_feedback_signals
  after insert on public.feedback_signals
  for each row
  execute function public.cleanup_old_feedback_signals();

-- RLS for feedback_signals
alter table public.feedback_signals enable row level security;

create policy "Users can read their own signals"
  on public.feedback_signals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own signals"
  on public.feedback_signals for insert
  with check (auth.uid() = user_id);
