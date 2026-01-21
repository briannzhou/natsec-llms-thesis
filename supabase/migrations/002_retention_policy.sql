-- Data Retention Policy
-- Requires pg_cron extension (available in Supabase Pro)

-- This migration sets up automatic data cleanup for 7-day retention
-- pg_cron must be enabled in the Supabase dashboard first

-- Clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired events (cascades to event_posts and event_history)
    DELETE FROM events WHERE expires_at < NOW();

    -- Delete old posts (7 days)
    DELETE FROM posts WHERE ingested_at < NOW() - INTERVAL '7 days';

    -- Delete old completed batches (7 days)
    DELETE FROM batches
    WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '7 days';

    -- Log cleanup
    RAISE NOTICE 'Data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- To schedule with pg_cron (run in Supabase SQL editor after enabling pg_cron):
-- SELECT cron.schedule(
--     'cleanup-expired-data',
--     '0 0 * * *',  -- Daily at midnight UTC
--     $$ SELECT cleanup_expired_data() $$
-- );
