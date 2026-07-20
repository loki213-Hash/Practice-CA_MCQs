import { supabase } from "../supabase/supabase";

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("display_order");

  if (error) throw error;

  return data;
}