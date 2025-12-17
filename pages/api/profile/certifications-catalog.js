import { getSupabaseServiceClient } from "@/lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return res
      .status(503)
      .json({ error: "Catalog service unavailable", categories: [] });
  }

  const { data, error } = await supabase
    .from("certifications_catalog")
    .select("id, name, category")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to load certifications catalog" });
  }

  return res.status(200).json({ categories: data || [] });
}
