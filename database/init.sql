-- AI-Powered Transparent Diagnostic System — PostgreSQL schema
-- Uses gen_random_uuid() (PG 13+) — works in Docker Postgres and embedded PGlite.

CREATE TYPE user_role AS ENUM ('patient', 'lab');
CREATE TYPE sample_status AS ENUM ('collected', 'dispatched', 'processing', 'completed');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  accreditation VARCHAR(500),
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  processing_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_code VARCHAR(32) NOT NULL UNIQUE,
  qr_token VARCHAR(64) NOT NULL UNIQUE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status sample_status NOT NULL DEFAULT 'collected',
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,
  processing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  test_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code VARCHAR(32) NOT NULL UNIQUE,
  sample_id UUID REFERENCES samples(id) ON DELETE SET NULL,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  storage_path VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  blockchain_hash VARCHAR(64),
  is_sealed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  raw_ocr_text TEXT,
  structured JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_samples_patient ON samples(patient_id);
CREATE INDEX idx_samples_lab ON samples(lab_id);
CREATE INDEX idx_samples_code ON samples(sample_code);
CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_reports_lab ON reports(lab_id);

CREATE OR REPLACE FUNCTION touch_samples_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_samples_updated
BEFORE UPDATE ON samples
FOR EACH ROW EXECUTE PROCEDURE touch_samples_updated();

CREATE OR REPLACE FUNCTION touch_report_analyses_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_report_analyses_updated
BEFORE UPDATE ON report_analyses
FOR EACH ROW EXECUTE PROCEDURE touch_report_analyses_updated();
