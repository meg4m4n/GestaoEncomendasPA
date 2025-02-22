import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

export async function handleDatabaseError(error: any): Promise<string> {
  console.error('Database error:', error);
  
  if (error?.code === '23505') {
    return 'Um registro com estes dados já existe.';
  }
  
  if (error?.code === '23503') {
    return 'Não é possível realizar esta operação devido a registros relacionados.';
  }

  if (error?.message) {
    return error.message;
  }
  
  return 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
}