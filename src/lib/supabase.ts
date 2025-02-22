import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhvuauhebopaujuktxhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodnVhdWhlYm9wYXVqdWt0eGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTYyMTAsImV4cCI6MjA1NTgzMjIxMH0.Wr05CaacizL6TrYgQKh6jomKHorkd2UgiWQlikfSK-s';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);