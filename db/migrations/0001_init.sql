-- Tally schema (plain Postgres; runs on Neon). Fictional polling units only; no INEC data is assumed.
-- Apply with `npm run db:migrate`, or paste into the Neon SQL editor.

create table if not exists polling_units (
  code              text primary key check (code ~ '^[A-Z]{2}[0-9]{2}-[0-9]{3}$'),
  name              text not null,
  ward              text not null,
  lga               text not null,
  state             text not null,
  registered_voters integer not null check (registered_voters >= 0),
  created_at        timestamptz not null default now()
);
create index if not exists polling_units_state_idx on polling_units (state);

-- One row per sender. sender_hash is a salted SHA-256 of the phone number; the number is never stored.
create table if not exists senders (
  sender_hash text primary key check (sender_hash ~ '^[0-9a-f]{64}$'),
  unit_code   text references polling_units (code),
  lang        text not null default 'en' check (lang in ('en', 'pcm', 'ha', 'yo', 'ig')),
  updated_at  timestamptz not null default now()
);

-- Live signals. One vote per sender per signal per unit, enforced by the unique constraint.
create table if not exists signals (
  id          bigserial primary key,
  unit_code   text not null references polling_units (code),
  signal      text not null check (signal in ('arrived', 'accred', 'queue')),
  sender_hash text not null check (sender_hash ~ '^[0-9a-f]{64}$'),
  created_at  timestamptz not null default now(),
  unique (unit_code, signal, sender_hash)
);
create index if not exists signals_unit_idx on signals (unit_code);

-- Result sheet submissions, appended to a single SHA-256 hash chain.
create table if not exists result_submissions (
  seq         bigserial primary key,
  unit_code   text not null references polling_units (code),
  sender_hash text not null check (sender_hash ~ '^[0-9a-f]{64}$'),
  party_a     integer not null check (party_a >= 0),
  party_b     integer not null check (party_b >= 0),
  party_c     integer not null check (party_c >= 0),
  party_d     integer not null check (party_d >= 0),
  rejected    integer not null check (rejected >= 0),
  accredited  integer not null check (accredited >= 0),
  has_photo   boolean not null default false,
  created_at  timestamptz not null,
  prev_hash   text not null unique check (prev_hash ~ '^[0-9a-f]{64}$'),
  hash        text not null unique check (hash ~ '^[0-9a-f]{64}$')
);
create index if not exists result_submissions_unit_idx on result_submissions (unit_code);

-- Append under a transaction-scoped advisory lock. The caller computes the hash in TypeScript
-- (lib/chain) from the head it read; if another write got in first the head has moved, we raise,
-- and the caller re-reads the head and retries. The unique index on prev_hash is a second guard:
-- no hash can ever have two successors, so the chain cannot fork.
create or replace function append_result_submission(
  p_unit_code text, p_sender_hash text,
  p_party_a integer, p_party_b integer, p_party_c integer, p_party_d integer,
  p_rejected integer, p_accredited integer, p_has_photo boolean,
  p_created_at timestamptz, p_prev_hash text, p_hash text
) returns result_submissions
language plpgsql
as $$
declare
  head text;
  inserted result_submissions;
begin
  perform pg_advisory_xact_lock(7240017);
  select hash into head from result_submissions order by seq desc limit 1;
  if coalesce(head, repeat('0', 64)) <> p_prev_hash then
    raise exception 'chain_head_moved';
  end if;
  insert into result_submissions (
    unit_code, sender_hash, party_a, party_b, party_c, party_d,
    rejected, accredited, has_photo, created_at, prev_hash, hash
  ) values (
    p_unit_code, p_sender_hash, p_party_a, p_party_b, p_party_c, p_party_d,
    p_rejected, p_accredited, p_has_photo, p_created_at, p_prev_hash, p_hash
  ) returning * into inserted;
  return inserted;
end;
$$;

-- The log is append-only: block row updates and deletes. (TRUNCATE by the database owner still
-- works for resetting a demo; see README.)
create or replace function forbid_result_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'result_submissions is append-only';
end;
$$;
drop trigger if exists result_submissions_append_only on result_submissions;
create trigger result_submissions_append_only
  before update or delete on result_submissions
  for each row execute function forbid_result_mutation();

-- Access: only the server holds DATABASE_URL. There is no public API in front of this database,
-- so no browser or third party can query it directly.
