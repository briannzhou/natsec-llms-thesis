import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import type { Database } from '@event-monitor/shared';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);
