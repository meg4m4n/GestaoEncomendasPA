import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase configuration');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

// Sign up with email/password
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function handleDatabaseError(error: any): Promise<string> {
  console.error('Database error:', error);
  
  if (error?.code === '23505') {
    return 'Um registro com estes dados já existe.';
  }
  
  if (error?.code === '23503') {
    return 'Não é possível realizar esta operação devido a registros relacionados.';
  }

  if (error?.code === '42501') {
    return 'Você precisa estar autenticado para realizar esta operação.';
  }

  if (error?.message) {
    return error.message;
  }
  
  return 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
}