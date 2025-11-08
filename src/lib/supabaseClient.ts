// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Get your URL and Key from the Supabase dashboard

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY



export const supabase = createClient(supabaseUrl, supabaseAnonKey)