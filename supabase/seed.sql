-- Polling units only. Demo reports and result submissions are inserted by `npm run seed`
-- so that they go through the same hash-chain code as live traffic.
insert into polling_units (code, name, ward, lga, state, registered_voters) values
  ('LA03-004', 'Unit 004, Ward 3', 'Ward 3', 'Demo LGA North', 'Lagos', 700),
  ('LA03-007', 'Unit 007, Ward 3', 'Ward 3', 'Demo LGA North', 'Lagos', 850),
  ('LA05-012', 'Unit 012, Ward 5', 'Ward 5', 'Demo LGA South', 'Lagos', 620),
  ('KN02-018', 'Unit 018, Ward 2', 'Ward 2', 'Demo LGA East', 'Kano', 780),
  ('KN02-031', 'Unit 031, Ward 2', 'Ward 2', 'Demo LGA East', 'Kano', 910),
  ('EN01-002', 'Unit 002, Ward 1', 'Ward 1', 'Demo LGA West', 'Enugu', 540)
on conflict (code) do nothing;
