-- Enable pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Monitor Configuration
CREATE TABLE monitor_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    x_query TEXT NOT NULL,                    -- X API query string
    quality_config JSONB NOT NULL DEFAULT '{}', -- Quality filter settings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending',   -- pending, processing, completed, failed
    posts_ingested INTEGER DEFAULT 0,
    posts_passed_quality INTEGER DEFAULT 0,
    clusters_created INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw X Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    x_post_id TEXT UNIQUE NOT NULL,           -- X's post ID (for dedup)
    author_id TEXT NOT NULL,
    author_username TEXT,
    author_followers INTEGER,
    author_verified BOOLEAN,
    account_created_at TIMESTAMPTZ,
    content TEXT NOT NULL,
    media_urls TEXT[],                        -- Array of media URLs
    likes INTEGER DEFAULT 0,
    retweets INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ NOT NULL,
    embedding VECTOR(1536),                   -- Grok embedding dimension
    quality_score FLOAT,                      -- Computed quality score
    quality_passed BOOLEAN DEFAULT false,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    batch_id UUID REFERENCES batches(id)      -- Links to processing batch
);

-- Event Clusters
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    parent_event_id UUID REFERENCES events(id), -- For versioning
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    event_type TEXT,                          -- conflict, humanitarian, political, etc.
    confidence_score FLOAT,
    post_count INTEGER NOT NULL,
    centroid_embedding VECTOR(1536),          -- Cluster centroid

    -- Location fields
    has_location BOOLEAN DEFAULT false,
    location_name TEXT,
    country TEXT,
    latitude FLOAT,
    longitude FLOAT,
    h3_index_res4 TEXT,                       -- Pre-computed H3 indices
    h3_index_res6 TEXT,
    h3_index_res8 TEXT,

    -- Metadata
    earliest_post_at TIMESTAMPTZ,
    latest_post_at TIMESTAMPTZ,
    batch_id UUID REFERENCES batches(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ                    -- For 7-day retention
);

-- Junction Table: Events <-> Posts
CREATE TABLE event_posts (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    similarity_score FLOAT,                   -- How similar to cluster centroid
    PRIMARY KEY (event_id, post_id)
);

-- Event Version History
CREATE TABLE event_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT,
    summary TEXT,
    post_count INTEGER,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_type TEXT                          -- created, updated, merged
);

-- Indexes

-- Posts indexes
CREATE INDEX idx_posts_x_post_id ON posts(x_post_id);
CREATE INDEX idx_posts_batch_id ON posts(batch_id);
CREATE INDEX idx_posts_quality ON posts(quality_passed) WHERE quality_passed = true;
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);

-- Vector similarity search indexes
CREATE INDEX idx_posts_embedding ON posts USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX idx_events_centroid ON events USING ivfflat (centroid_embedding vector_cosine_ops)
    WITH (lists = 100);

-- Event queries indexes
CREATE INDEX idx_events_has_location ON events(has_location);
CREATE INDEX idx_events_h3_res4 ON events(h3_index_res4) WHERE h3_index_res4 IS NOT NULL;
CREATE INDEX idx_events_h3_res6 ON events(h3_index_res6) WHERE h3_index_res6 IS NOT NULL;
CREATE INDEX idx_events_h3_res8 ON events(h3_index_res8) WHERE h3_index_res8 IS NOT NULL;
CREATE INDEX idx_events_created ON events(created_at DESC);
CREATE INDEX idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_events_event_type ON events(event_type);

-- Full-text search indexes
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || summary));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', content));

-- Event history index
CREATE INDEX idx_event_history_event_id ON event_history(event_id);

-- Row Level Security (Public Read-Only)

-- Enable RLS on all tables
ALTER TABLE monitor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON posts FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON event_posts FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON event_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON batches FOR SELECT TO anon USING (true);

-- Service role has full access (for worker)
CREATE POLICY "Service role full access" ON monitor_config FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON batches FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON event_posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON event_history FOR ALL TO service_role USING (true);

-- Triggers for updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monitor_config_updated_at
    BEFORE UPDATE ON monitor_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
