import { createClient } from "@supabase/supabase-js";

// La "anon key" está pensada para ser pública (queda visible en el navegador
// de todas formas). La seguridad real la dan las políticas RLS en la base
// de datos, no el secreto de esta clave.
const SUPABASE_URL = "https://zroavleulcjysfinydof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyb2F2bGV1bGNqeXNmaW55ZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDI1MzksImV4cCI6MjEwNDM3ODUzOX0.V0hE0t-yHkTpy-7IywIz1eIznCYGVgkQi9hf6m4AhYo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);