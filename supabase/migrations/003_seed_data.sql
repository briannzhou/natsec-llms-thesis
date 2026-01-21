-- Seed Data - Default Monitor Configuration

-- Insert a default monitor configuration (inactive by default)
-- Update x_query with specific search query before activating
INSERT INTO monitor_config (name, description, x_query, quality_config, is_active)
VALUES (
    'Default Monitor',
    'Default event monitor configuration. Update x_query and activate.',
    '(conflict OR military OR humanitarian) lang:en -is:retweet',
    '{
        "minEngagement": 5,
        "minFollowers": 100,
        "minAccountAgeDays": 30,
        "requireVerified": false,
        "enableContentScoring": true,
        "minContentScore": 0.3
    }'::jsonb,
    false  -- Set to true when ready to activate
);
