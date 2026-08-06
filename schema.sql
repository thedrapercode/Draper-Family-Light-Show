CREATE TABLE IF NOT EXISTS reservations (
  id               TEXT    PRIMARY KEY,
  date             TEXT    NOT NULL,
  slot_time        TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  email            TEXT    NOT NULL,
  guests           INTEGER NOT NULL DEFAULT 1,
  donation_cents   INTEGER NOT NULL DEFAULT 0,
  square_payment_id TEXT,
  confirmation_code TEXT   NOT NULL,
  created_at       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_date_slot ON reservations (date, slot_time);
