import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysseiwtcbwvjdyyvhzsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzc2Vpd3RjYnd2amR5eXZoenN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzgxMzQsImV4cCI6MjA5MTkxNDEzNH0.kw8HCPybxvg7T5jc-v5lkeUFAFNyVgsX6ro_seLFnO4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
