import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PROJECT_URL ?? '';
const supabaseKey = process.env.SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Configure PROJECT_URL and SERVICE_ROLE_KEY.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const invokeFunction = async (functionName, payload = {}) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  return supabase.functions.invoke(functionName, { body: payload });
};

export { supabase };
