import { supabase } from './db.js';
import { eventDetectionGraph } from './graphs/event-detection.js';

/**
 * Run a batch processing job
 */
export async function runBatch(): Promise<void> {
  console.log('Starting batch processing...');

  // Get active monitor configuration
  const { data: monitorConfig } = await supabase
    .from('monitor_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!monitorConfig) {
    console.log('No active monitor configuration found');
    return;
  }

  // Create batch record
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .insert({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (batchError || !batch) {
    console.error('Failed to create batch:', batchError);
    return;
  }

  console.log(`Created batch: ${batch.id}`);

  try {
    // Run the event detection workflow
    const result = await eventDetectionGraph.invoke({
      batchId: batch.id,
      monitorQuery: monitorConfig.x_query,
      posts: [],
      clusters: [],
      summaries: new Map(),
      geocodedLocations: new Map(),
      eventMatches: new Map(),
      errors: [],
    });

    // Update batch status
    await supabase
      .from('batches')
      .update({
        status: 'completed',
        posts_ingested: result.posts?.length ?? 0,
        posts_passed_quality: result.posts?.length ?? 0,
        clusters_created: result.clusters?.length ?? 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    console.log(`Batch completed: ${batch.id}`);
    console.log(`  Posts processed: ${result.posts?.length ?? 0}`);
    console.log(`  Clusters created: ${result.clusters?.length ?? 0}`);

    if (result.errors?.length > 0) {
      console.warn('Errors during processing:', result.errors);
    }
  } catch (error) {
    console.error('Batch failed:', error);

    await supabase
      .from('batches')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    throw error;
  }
}

// Run if executed directly
if (process.argv[1]?.includes('batch-orchestrator')) {
  runBatch()
    .then(() => {
      console.log('Batch job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Batch job failed:', error);
      process.exit(1);
    });
}
