-- =========================================================
-- ERP SCHEMA: 04_staff_and_attendance.sql
-- Қызметкерлерді басқару (HR) және Жұмыс уақыты табелі (Attendance)
-- =========================================================

-- 1. Қызметкер профильдері
CREATE TABLE IF NOT EXISTS staff_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id      UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cook', 'waiter', 'cashier', 'courier')),
  phone        TEXT,
  salary_type  TEXT DEFAULT 'hourly' CHECK (salary_type IN ('fixed', 'hourly', 'percent')),
  base_rate    NUMERIC(10, 2) DEFAULT 0.00,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Жұмыс уақытының есебі (Табель)
CREATE TABLE IF NOT EXISTS staff_attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id      UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  staff_id     UUID REFERENCES staff_profiles(id) ON DELETE CASCADE NOT NULL,
  work_date    DATE NOT NULL,
  check_in     TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out    TIMESTAMPTZ,
  hours_worked NUMERIC(5, 2),
  status       TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'sick_leave')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON staff_attendance(cafe_id, work_date);

-- RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and Managers can manage staff"
  ON staff_profiles FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Owners and Managers can manage attendance"
  ON staff_attendance FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR staff_id = auth.uid()
  );
