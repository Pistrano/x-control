import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yafdhuitlzjrpuhyxaae.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZmRodWl0bHpqcnB1aHl4YWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODIwMDAsImV4cCI6MjA5MTk1ODAwMH0.OxhGQ8ZG1W9LtM8TW7k_pZwIE_PoA310QtsN-3-R53I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);