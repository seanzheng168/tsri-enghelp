import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iaidtowsigcjfdtzbmpk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhaWR0b3dzaWdjamZkdHpibXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjUxNDEsImV4cCI6MjA2OTUwMTE0MX0.--riFLL1ZeREI3p7nNYwzxnFMUtIuaxL1qYIihl98WM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
