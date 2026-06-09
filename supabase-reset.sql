-- Wipe all quiz data between sessions, keeping the schema/policies/function intact.
-- Run in the Supabase SQL Editor. `cascade` clears answers via the FK; `restart identity`
-- resets any identity sequences. To rebuild from scratch instead, drop the tables and
-- re-run supabase-schema.sql.

truncate table answers, participants restart identity cascade;
