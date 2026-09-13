import { createClient } from "@supabase/supabase-js";
import { IS_LIVE, SUPABASE_ANON_KEY, SUPABASE_URL } from "../config.js";

export const supabase = IS_LIVE ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
