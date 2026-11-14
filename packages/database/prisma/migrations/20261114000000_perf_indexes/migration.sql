-- ──────────────────────────────────────────────────────────────────────────────
-- Performance indexes — applied 2026-11-14
-- All statements use IF NOT EXISTS so this is safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────────

-- Enable pg_trgm for fast LIKE / ILIKE text search on doctor names & addresses.
-- This extension is available on all Neon plans at no extra cost.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Doctor ────────────────────────────────────────────────────────────────────
-- Most map/explore queries filter by isActive + specialtyId
CREATE INDEX IF NOT EXISTS "Doctor_isActive_idx"
  ON "Doctor"("isActive");

CREATE INDEX IF NOT EXISTS "Doctor_isActive_specialtyId_idx"
  ON "Doctor"("isActive", "specialtyId");

-- Full-text trigram indexes so "contains" searches on names and address are
-- served by an index instead of a sequential scan.
CREATE INDEX IF NOT EXISTS "Doctor_name_trgm_idx"
  ON "Doctor" USING gin("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Doctor_nameAr_trgm_idx"
  ON "Doctor" USING gin("nameAr" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Doctor_clinicAddress_trgm_idx"
  ON "Doctor" USING gin("clinicAddress" gin_trgm_ops);

-- ── Post ──────────────────────────────────────────────────────────────────────
-- Feed queries fetch posts ordered by createdAt DESC for a given doctorId.
CREATE INDEX IF NOT EXISTS "Post_doctorId_createdAt_idx"
  ON "Post"("doctorId", "createdAt" DESC);

-- ── Appointment ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_date_idx"
  ON "Appointment"("doctorId", "date");

CREATE INDEX IF NOT EXISTS "Appointment_doctorId_status_idx"
  ON "Appointment"("doctorId", "status");

CREATE INDEX IF NOT EXISTS "Appointment_patientId_idx"
  ON "Appointment"("patientId");

-- ── DoctorRating ──────────────────────────────────────────────────────────────
-- Aggregate (AVG / COUNT) queries always filter by doctorId.
CREATE INDEX IF NOT EXISTS "DoctorRating_doctorId_idx"
  ON "DoctorRating"("doctorId");

-- ── DoctorStory ───────────────────────────────────────────────────────────────
-- Active-story checks filter by expiresAt > now(), often also by doctorId.
CREATE INDEX IF NOT EXISTS "DoctorStory_expiresAt_idx"
  ON "DoctorStory"("expiresAt");

CREATE INDEX IF NOT EXISTS "DoctorStory_doctorId_expiresAt_idx"
  ON "DoctorStory"("doctorId", "expiresAt");

-- ── DoctorFollow ──────────────────────────────────────────────────────────────
-- Follower-count queries group by doctorId.
CREATE INDEX IF NOT EXISTS "DoctorFollow_doctorId_idx"
  ON "DoctorFollow"("doctorId");

-- ── DoctorSubscription ────────────────────────────────────────────────────────
-- doctorId already has a UNIQUE index; add expiresAt for covering queries
-- (WHERE doctorId IN (...) AND expiresAt > now()).
CREATE INDEX IF NOT EXISTS "DoctorSubscription_expiresAt_idx"
  ON "DoctorSubscription"("expiresAt");

-- ── Patient ───────────────────────────────────────────────────────────────────
-- Clinic management queries always scope by doctorId.
CREATE INDEX IF NOT EXISTS "Patient_doctorId_idx"
  ON "Patient"("doctorId");

CREATE INDEX IF NOT EXISTS "Patient_doctorId_isActive_idx"
  ON "Patient"("doctorId", "isActive");

-- ── Message ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Message_fromUserId_idx"
  ON "Message"("fromUserId");

CREATE INDEX IF NOT EXISTS "Message_toUserId_isRead_idx"
  ON "Message"("toUserId", "isRead");

-- ── AuthRateLimit ─────────────────────────────────────────────────────────────
-- Expire old rows efficiently (cleanup query will filter by windowStart).
CREATE INDEX IF NOT EXISTS "AuthRateLimit_windowStart_idx"
  ON "AuthRateLimit"("windowStart");
