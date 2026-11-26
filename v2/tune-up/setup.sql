-- Sleep Fit Tune-Up: database setup for Supabase.
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run. Safe to run twice.

-- One row per player: their display name and all of their answers.
create table if not exists public.votes (
  id   text primary key,              -- a fingerprint of the player's device key (never the key itself)
  name text  not null default '',
  a    jsonb not null default '{}'::jsonb,
  u    bigint not null default 0      -- last update, milliseconds
);

alter table public.votes enable row level security;

-- Anyone with the game link may read the team's answers (needed for the leaderboard and progress bars).
drop policy if exists "read votes" on public.votes;
create policy "read votes" on public.votes for select to anon using (true);

-- Nobody writes to the table directly. A player saves through this function, which only ever
-- touches the row that belongs to their own device key, so one player cannot change another's answers.
create or replace function public.save_votes(secret text, player text, answers jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.votes (id, name, a, u)
  select encode(sha256(convert_to(secret, 'UTF8')), 'hex'), left(coalesce(player, ''), 40), answers,
         (extract(epoch from now()) * 1000)::bigint
  where length(secret) >= 32
    and jsonb_typeof(answers) = 'object'
    and pg_column_size(answers) < 100000
  on conflict (id) do update set name = excluded.name, a = excluded.a, u = excluded.u;
$$;

revoke all on function public.save_votes(text, text, jsonb) from public;
grant execute on function public.save_votes(text, text, jsonb) to anon;

-- To wipe every answer and start fresh (for example after a test run), run:
--   truncate table public.votes;
