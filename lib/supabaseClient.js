import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jkhbxrfdlhztfarcorkn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGJ4cmZkbGh6dGZhcmNvcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTc4ODIsImV4cCI6MjA5MTAzMzg4Mn0.ByxumFgvOVObVgDNDKZQRWZ2UJboepajG7x1SKcdcEc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)