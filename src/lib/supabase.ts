import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhvuauhebopaujuktxhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodnVhdWhlYm9wYXVqdWt0eGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTYyMTAsImV4cCI6MjA1NTgzMjIxMH0.Wr05CaacizL6TrYgQKh6jomKHorkd2UgiWQlikfSK-s';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handleDatabaseError(error: any): Promise<string> {
  console.error('Database error:', error);
  
  if (error?.code === '23505') {
    return 'Um registro com estes dados já existe.';
  }
  
  if (error?.code === '23503') {
    return 'Não é possível realizar esta operação devido a registros relacionados.';
  }
  
  return 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
}