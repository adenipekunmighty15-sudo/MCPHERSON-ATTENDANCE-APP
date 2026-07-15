-- ═══════════════════════════════════════════════════════════════════════
-- Migration 003: Geolocation, UWB, and Real-time Tracking
-- Positions, Campus Buildings, Classroom Anchors
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. REAL-TIME POSITIONS ──
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION DEFAULT 0,
  source VARCHAR(20) DEFAULT 'gps' CHECK (source IN ('gps', 'uwb', 'wifi', 'manual')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_user ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_timestamp ON public.positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_positions_location ON public.positions(latitude, longitude);

-- ── 2. CAMPUS BUILDINGS ──
CREATE TABLE IF NOT EXISTS public.campus_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  floors INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. CLASSROOM UWB ANCHORS ──
CREATE TABLE IF NOT EXISTS public.classroom_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  anchor_code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  floor INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, anchor_code)
);

CREATE INDEX IF NOT EXISTS idx_anchors_venue ON public.classroom_anchors(venue_id);

-- ── 4. SEED CAMPUS BUILDINGS ──
INSERT INTO public.campus_buildings (name, code, latitude, longitude, floors, description) VALUES
  ('Main Hall', 'main-hall', 6.8718, 3.2052, 3, 'Main lecture halls and administrative offices'),
  ('Science Block', 'science-block', 6.8712, 3.2058, 4, 'Science laboratories and lecture rooms'),
  ('Library', 'library', 6.8710, 3.2050, 2, 'University library and reading rooms'),
  ('Administration Building', 'admin-building', 6.8720, 3.2055, 3, 'University administrative offices'),
  ('Engineering Block', 'engineering-block', 6.8714, 3.2060, 3, 'Engineering and technology labs'),
  ('Student Center', 'student-center', 6.8716, 3.2048, 1, 'Student services and recreation')
ON CONFLICT (code) DO NOTHING;

-- ── 5. SEED CLASSROOM ANCHORS ──
INSERT INTO public.classroom_anchors (venue_id, anchor_code, label, latitude, longitude, floor)
SELECT v.id, a.code, a.label, a.lat, a.lng, a.floor
FROM (VALUES
  ('LT-1', 'LT-1-A1', 'Anchor 1', 6.8715, 3.2051, 1),
  ('LT-1', 'LT-1-A2', 'Anchor 2', 6.8719, 3.2051, 1),
  ('LT-1', 'LT-1-A3', 'Anchor 3', 6.8719, 3.2055, 1),
  ('LT-1', 'LT-1-A4', 'Anchor 4', 6.8715, 3.2055, 1),
  ('LT-2', 'LT-2-A1', 'Anchor 1', 6.8716, 3.2052, 2),
  ('LT-2', 'LT-2-A2', 'Anchor 2', 6.8720, 3.2052, 2),
  ('LT-2', 'LT-2-A3', 'Anchor 3', 6.8720, 3.2056, 2),
  ('LT-2', 'LT-2-A4', 'Anchor 4', 6.8716, 3.2056, 2),
  ('CS-LAB-1', 'CSL1-A1', 'Anchor 1', 6.8711, 3.2057, 2),
  ('CS-LAB-1', 'CSL1-A2', 'Anchor 2', 6.8715, 3.2057, 2),
  ('CS-LAB-1', 'CSL1-A3', 'Anchor 3', 6.8715, 3.2061, 2),
  ('CS-LAB-1', 'CSL1-A4', 'Anchor 4', 6.8711, 3.2061, 2),
  ('ENG-101', 'ENG-A1', 'Anchor 1', 6.8712, 3.2059, 1),
  ('ENG-101', 'ENG-A2', 'Anchor 2', 6.8716, 3.2059, 1),
  ('ENG-101', 'ENG-A3', 'Anchor 3', 6.8716, 3.2063, 1),
  ('ENG-101', 'ENG-A4', 'Anchor 4', 6.8712, 3.2063, 1)
) AS a(room_code, code, label, lat, lng, floor)
JOIN public.venues v ON v.room_code = a.room_code
WHERE EXISTS (SELECT 1 FROM public.venues WHERE room_code = a.room_code)
ON CONFLICT (venue_id, anchor_code) DO NOTHING;

-- ── 6. ADD RADIUS TO VENUES IF NOT EXISTS ──
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 20;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.campus_buildings(id) ON DELETE SET NULL;

-- ── 7. UPDATE VENUE LOCATIONS WITH MCPHERSON CAMPUS COORDINATES ──
UPDATE public.venues SET
  latitude = CASE room_code
    WHEN 'LT-1' THEN 6.8717
    WHEN 'LT-2' THEN 6.8718
    WHEN 'CS-LAB-1' THEN 6.8713
    WHEN 'CS-LAB-2' THEN 6.8713
    WHEN 'PHY-LAB' THEN 6.8711
    WHEN 'ENG-101' THEN 6.8714
    WHEN 'LIB-READ' THEN 6.8710
    ELSE latitude
  END,
  longitude = CASE room_code
    WHEN 'LT-1' THEN 3.2053
    WHEN 'LT-2' THEN 3.2054
    WHEN 'CS-LAB-1' THEN 3.2059
    WHEN 'CS-LAB-2' THEN 3.2060
    WHEN 'PHY-LAB' THEN 3.2057
    WHEN 'ENG-101' THEN 3.2061
    WHEN 'LIB-READ' THEN 3.2050
    ELSE longitude
  END,
  radius_meters = 20
WHERE room_code IN ('LT-1', 'LT-2', 'CS-LAB-1', 'CS-LAB-2', 'PHY-LAB', 'ENG-101', 'LIB-READ');
