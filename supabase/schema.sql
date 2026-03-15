-- =============================================
-- MedRate MVP — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'clinic_admin', 'moderator')),
  full_name TEXT,
  iin TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  discount_balance INTEGER DEFAULT 0,
  visits_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinics
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Алматы',
  description TEXT,
  logo_url TEXT,
  admin_id UUID REFERENCES profiles(id),
  clinic_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  working_hours TEXT DEFAULT '09:00–18:00',
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  specialty TEXT,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  avatar_url TEXT,
  communication_rating NUMERIC(3,2) DEFAULT 0,
  professionalism_rating NUMERIC(3,2) DEFAULT 0,
  clinic_criteria_rating NUMERIC(3,2) DEFAULT 0,
  total_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Visits (QR scan records)
CREATE TABLE IF NOT EXISTS visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  clinic_id UUID REFERENCES clinics(id),
  doctor_id UUID REFERENCES doctors(id),
  qr_token TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  can_review_at TIMESTAMPTZ GENERATED ALWAYS AS (scanned_at + INTERVAL '1 hour') STORED,
  is_reviewed BOOLEAN DEFAULT FALSE
);

-- 5. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctors(id),
  visit_id UUID REFERENCES visits(id),
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  professionalism_score INTEGER CHECK (professionalism_score BETWEEN 1 AND 5),
  clinic_score INTEGER CHECK (clinic_score BETWEEN 1 AND 5),
  average_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (communication_score + professionalism_score + clinic_score)::NUMERIC / 3
  ) STORED,
  text TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'ai_review', 'human_review', 'approved', 'rejected')
  ),
  ai_analysis JSONB,
  ai_flags TEXT[] DEFAULT '{}',
  moderation_notes TEXT,
  moderated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctors(id),
  clinic_id UUID REFERENCES clinics(id),
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  priority INTEGER DEFAULT 1,
  ai_summary TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Clinics policies
CREATE POLICY "Clinics readable by all" ON clinics FOR SELECT USING (true);
CREATE POLICY "Clinic admin manages own clinic" ON clinics FOR ALL
  USING (auth.uid() = admin_id);

-- Doctors policies
CREATE POLICY "Doctors readable by all" ON doctors FOR SELECT USING (true);
CREATE POLICY "Clinic admin manages doctors" ON doctors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM clinics WHERE clinics.id = doctors.clinic_id AND clinics.admin_id = auth.uid()
  ));

-- Visits policies
CREATE POLICY "Patient sees own visits" ON visits FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Clinic sees its visits" ON visits FOR SELECT
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = visits.clinic_id AND clinics.admin_id = auth.uid()));
CREATE POLICY "Insert visits" ON visits FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Update own visits" ON visits FOR UPDATE USING (auth.uid() = patient_id);

-- Reviews policies
CREATE POLICY "Approved reviews public" ON reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = patient_id);
CREATE POLICY "Patient creates review" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient updates own review" ON reviews FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Moderators see all reviews" ON reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'moderator'));
CREATE POLICY "Moderators update reviews" ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'clinic_admin')));

-- Appointments policies
CREATE POLICY "Patient sees own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patient creates appointment" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patient updates own appointment" ON appointments FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Clinic sees its appointments" ON appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = appointments.clinic_id AND clinics.admin_id = auth.uid()));
CREATE POLICY "Clinic updates appointment status" ON appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM clinics WHERE clinics.id = appointments.clinic_id AND clinics.admin_id = auth.uid()));

-- Moderation queue policies
CREATE POLICY "Moderators manage queue" ON moderation_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'clinic_admin')));

-- =============================================
-- Functions & Triggers
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update doctor ratings after review approved
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE doctors SET
      communication_rating = (
        SELECT AVG(communication_score) FROM reviews
        WHERE doctor_id = NEW.doctor_id AND status = 'approved'
      ),
      professionalism_rating = (
        SELECT AVG(professionalism_score) FROM reviews
        WHERE doctor_id = NEW.doctor_id AND status = 'approved'
      ),
      clinic_criteria_rating = (
        SELECT AVG(clinic_score) FROM reviews
        WHERE doctor_id = NEW.doctor_id AND status = 'approved'
      ),
      total_rating = (
        SELECT AVG((communication_score + professionalism_score + clinic_score)::NUMERIC / 3)
        FROM reviews WHERE doctor_id = NEW.doctor_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*) FROM reviews
        WHERE doctor_id = NEW.doctor_id AND status = 'approved'
      )
    WHERE id = NEW.doctor_id;

    -- Update clinic rating
    UPDATE clinics SET
      clinic_rating = (
        SELECT AVG(total_rating) FROM doctors WHERE clinic_id = clinics.id AND is_active = TRUE
      ),
      review_count = (
        SELECT COUNT(*) FROM reviews r
        JOIN doctors d ON r.doctor_id = d.id
        WHERE d.clinic_id = clinics.id AND r.status = 'approved'
      )
    WHERE id = (SELECT clinic_id FROM doctors WHERE id = NEW.doctor_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_approved
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_doctor_rating();

-- =============================================
-- Sample data (for testing)
-- =============================================

-- Insert sample clinic (run after creating admin account manually)
-- INSERT INTO clinics (name, address, city, description, categories, working_hours, phone)
-- VALUES (
--   'Клиника Медицина',
--   'ул. Абая 10',
--   'Алматы',
--   'Многопрофильная клиника с современным оборудованием',
--   ARRAY['Терапия', 'Стоматология', 'Кардиология'],
--   '08:00–20:00',
--   '+7 (727) 123-45-67'
-- );
