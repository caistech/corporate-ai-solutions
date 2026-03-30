-- Client Reviews System
-- Auto-updates constants.ts on approval

CREATE TABLE client_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client info
  client_name TEXT NOT NULL,
  client_title TEXT,
  client_company TEXT,
  client_photo_url TEXT,
  client_linkedin_url TEXT,
  
  -- Review content
  review_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  platform_used TEXT,  -- Which product they're reviewing
  
  -- Source
  source TEXT CHECK (source IN ('form', 'voice', 'email', 'manual')),
  source_metadata JSONB,  -- Voice recording URL, form submission ID, etc.
  
  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,
  
  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,  -- Show on homepage
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(client_name, '') || ' ' || 
      coalesce(client_company, '') || ' ' || 
      coalesce(review_text, '') || ' ' ||
      coalesce(platform_used, '')
    )
  ) STORED
);

-- Indexes
CREATE INDEX idx_reviews_status ON client_reviews(status);
CREATE INDEX idx_reviews_published ON client_reviews(published) WHERE published = true;
CREATE INDEX idx_reviews_featured ON client_reviews(featured) WHERE featured = true;
CREATE INDEX idx_reviews_platform ON client_reviews(platform_used);
CREATE INDEX idx_reviews_search ON client_reviews USING GIN(search_vector);
CREATE INDEX idx_reviews_created ON client_reviews(created_at DESC);

-- RLS Policies
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved/published reviews
CREATE POLICY "Public read published reviews"
  ON client_reviews FOR SELECT
  USING (published = true AND status = 'approved');

-- Authenticated users can submit reviews
CREATE POLICY "Anyone can submit reviews"
  ON client_reviews FOR INSERT
  WITH CHECK (true);

-- Only admins can moderate
CREATE POLICY "Admins can moderate"
  ON client_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Function to auto-update constants.ts on approval
CREATE OR REPLACE FUNCTION sync_reviews_to_constants()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on approval
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Set published timestamp
    NEW.published_at = NOW();
    NEW.published = true;
    
    -- Trigger webhook to update constants.ts
    -- (Handled by external service - see deployment section)
    PERFORM pg_notify('review_approved', json_build_object(
      'review_id', NEW.id,
      'action', 'approved'
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_approval
  BEFORE UPDATE ON client_reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_reviews_to_constants();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON client_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
