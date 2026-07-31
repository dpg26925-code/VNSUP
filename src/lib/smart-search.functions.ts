import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({
  q: z.string().trim().min(1).max(200),
  industry: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
});

type Expansion = {
  keywords: string[];
  industries: string[];
};

async function expandQuery(q: string): Promise<Expansion> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { keywords: [q], industries: [] };

  const system =
    "Bạn là trợ lý tìm kiếm B2B ngành sản xuất Việt Nam. Với truy vấn của người dùng, hãy mở rộng thành các từ khóa (tiếng Việt và tiếng Anh) và ngành sản xuất tương ứng để tìm nhà cung ứng/nhà máy. Trả về JSON đúng schema. Không giải thích.";
  const user = `Truy vấn: "${q}"

Trả JSON:
{
  "keywords": [tối đa 10 từ/cụm từ ngắn liên quan trực tiếp: từ đồng nghĩa, tên sản phẩm cụ thể, thuật ngữ ngành, tiếng Anh tương đương. VD "Áo Blouse" -> ["áo blouse","áo sơ mi nữ","áo kiểu nữ","blouse","may mặc nữ","garment","OEM may mặc"]],
  "industries": [tối đa 3 tên ngành cấp cao trong tiếng Việt, VD "Dệt may", "May mặc", "Cơ khí chế tạo", "Điện tử", "Nhựa - Cao su", "Thực phẩm", "Hóa chất", "Gỗ - Nội thất", "Bao bì - In ấn", "Vật liệu xây dựng"]
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return { keywords: [q], industries: [] };
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: unknown): k is string => typeof k === "string" && k.trim().length > 0).slice(0, 10)
      : [];
    const industries = Array.isArray(parsed.industries)
      ? parsed.industries.filter((k: unknown): k is string => typeof k === "string" && k.trim().length > 0).slice(0, 3)
      : [];
    if (!keywords.includes(q)) keywords.unshift(q);
    return { keywords, industries };
  } catch {
    return { keywords: [q], industries: [] };
  }
}

function escapeIlike(v: string) {
  // Escape PostgREST or-filter reserved chars in a value
  return v.replace(/[,()"\\]/g, " ").trim();
}

export const smartSearch = createServerFn({ method: "POST" })
  .inputValidator((raw) => Input.parse(raw))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(url, anon, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (anon.startsWith("sb_") && h.get("Authorization") === `Bearer ${anon}`) h.delete("Authorization");
          h.set("apikey", anon);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const expansion = await expandQuery(data.q);

    // Build OR filter: match any keyword across name/description/industry/sub_industry/capabilities
    const terms = Array.from(new Set(expansion.keywords.map(escapeIlike).filter(Boolean)));
    const orParts: string[] = [];
    for (const t of terms) {
      const pat = `%${t}%`;
      orParts.push(`name.ilike.${pat}`);
      orParts.push(`description.ilike.${pat}`);
      orParts.push(`ai_summary.ilike.${pat}`);
      orParts.push(`industry.ilike.${pat}`);
      orParts.push(`sub_industry.ilike.${pat}`);
    }

    for (const ind of expansion.industries.map(escapeIlike)) {
      orParts.push(`industry.ilike.%${ind}%`);
    }

    let qb = supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("status", "approved")
      .limit(60);

    if (orParts.length > 0) qb = qb.or(orParts.join(","));
    if (data.industry) qb = qb.eq("industry", data.industry);
    if (data.province) qb = qb.eq("province", data.province);
    if (data.size) qb = qb.eq("employee_range", data.size);

    qb = qb.order("featured", { ascending: false }).order("verified", { ascending: false });

    const { data: rows, error } = await qb;
    if (error) {
      return { rows: [], expansion, error: error.message };
    }

    let result = rows ?? [];

    // Fallback: capabilities is jsonb — match its text content client-side
    if (result.length === 0) {
      let fb = supabase
        .from("companies")
        .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
        .eq("status", "approved")
        .limit(500);
      if (data.industry) fb = fb.eq("industry", data.industry);
      if (data.province) fb = fb.eq("province", data.province);
      if (data.size) fb = fb.eq("employee_range", data.size);
      const { data: all } = await fb;
      const needles = terms.map((t) => t.toLowerCase());
      result = (all ?? [])
        .filter((c) => {
          const hay = JSON.stringify(c).toLowerCase();
          return needles.some((n) => hay.includes(n));
        })
        .slice(0, 60);
    }

    return { rows: result, expansion, error: null as string | null };
  });

