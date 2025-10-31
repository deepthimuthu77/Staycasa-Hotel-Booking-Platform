// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Get your URL and Key from the Supabase dashboard
const supabaseUrl = 'https://pxgkwynzrvaihnjkgsvs.supabase.co'
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2t3eW56cnZhaWhuamtnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTQxMzYsImV4cCI6MjA3NzQ5MDEzNn0.ZAvSoRFD6-2QrxauPz9x6mYSGMn4ABPNdt3tqiB8M6g"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)