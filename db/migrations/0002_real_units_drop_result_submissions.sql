-- The count now comes from the results portal, not from figures voters send in (docs/adr/0002).
-- Drops the voter-submitted result log and switches polling units to real INEC unit codes.

drop trigger if exists result_submissions_append_only on result_submissions;
drop function if exists append_result_submission(
  text, text, integer, integer, integer, integer, integer, integer, boolean, timestamptz, text, text
);
drop table if exists result_submissions;
drop function if exists forbid_result_mutation();

-- The fictional demo units used codes like LA03-007. Real codes are state/local government/ward/unit,
-- e.g. 32/15/04/012. Clear the fictional rows (and what pointed at them), then change the rule.
delete from signals;
delete from senders;
delete from polling_units;

alter table polling_units drop constraint if exists polling_units_code_check;
alter table polling_units
  add constraint polling_units_code_check check (code ~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}/[0-9]{3}$');

drop index if exists polling_units_state_idx;
create index if not exists polling_units_lga_idx on polling_units (lga);
