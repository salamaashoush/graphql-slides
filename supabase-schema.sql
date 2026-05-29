-- Run this once in your Supabase project (SQL Editor) to enable the live quiz leaderboard.

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  question_id text not null,
  choice int not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  -- only the first answer per (participant, question) counts
  unique (participant_id, question_id)
);

alter table participants enable row level security;
alter table answers enable row level security;

-- The deck runs with the public anon key, so anon needs insert + read.
-- (Fine for a fun, prize-style quiz. Identity is name-only, not authenticated.)
create policy "anon insert participant" on participants for insert to anon with check (true);
create policy "anon read participants"  on participants for select to anon using (true);
create policy "anon insert answer"      on answers      for insert to anon with check (true);
create policy "anon update answer"      on answers      for update to anon using (true) with check (true);
create policy "anon read answers"       on answers      for select to anon using (true);

-- Aggregated leaderboard: correct answers desc, then fewest total (faster) first.
create or replace function leaderboard(top_n int default 10)
returns table (name text, correct bigint, answered bigint)
language sql stable as $$
  select p.name,
         count(*) filter (where a.is_correct) as correct,
         count(*)                              as answered
  from answers a
  join participants p on p.id = a.participant_id
  group by p.name
  order by correct desc, answered asc
  limit top_n
$$;

-- For the live-updating board, enable Realtime on the `answers` table:
--   Supabase Dashboard -> Database -> Replication -> add `answers` to the publication.
