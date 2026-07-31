// Server-only helpers for batch company import (/api/public/admin/companies/batch).
import { slugify } from "@/lib/admin-api.server";

export type ImportOptions = {
  auto_publish: boolean;
  skip_duplicates: boolean;
  min_quality_score: number;
  enrich_with_ai: boolean;
  notify_on_complete: boolean;
  dry_run: boolean;
};

export const DEFAULT_OPTIONS: ImportOptions = {
  auto_publish: false,
  skip_duplicates: true,
  min_quality_score: 0,
  enrich_with_ai: false,
  notify_on_complete: false,
  dry_run: false,
};

export function normalizeOptions(raw: unknown): ImportOptions {
  const o = (raw ?? {}) as Record<string, unknown>;
  const bool = (k: keyof ImportOptions, d: boolean) => (typeof o[k] === "boolean" ? (o[k] as boolean) : d);
  const score = Number(o.min_quality_score);
  return {
    auto_publish: bool("auto_publish", DEFAULT_OPTIONS.auto_publish),
    skip_duplicates: bool("skip_duplicates", DEFAULT_OPTIONS.skip_duplicates),
    min_quality_score: Number.isFinite(score) ? Math.min(Math.max(score, 0), 100) : 0,
    enrich_with_ai: bool("enrich_with_ai", DEFAULT_OPTIONS.enrich_with_ai),
    notify_on_complete: bool("notify_on_complete", DEFAULT_OPTIONS.notify_on_complete),
    dry_run: bool("dry_run", DEFAULT_OPTIONS.dry_run),
  };
}

export type RawCompany = Record<string, unknown>;

export type ImportResultRow = {
  name: string;
  slug: string | null;
  status: "imported" | "updated" | "skipped" | "error";
  id?: string | null;
  score?: number;
  reason?: string;
  message: string;
};

const EMPLOYEE_MAP: Record<string, string> = {
  "1-10": "1-10", "11-50": "11-50", "51-200": "51-200",
  "201-500": "201-500", "501-1000": "501-1000", "1000+": "1000+",
};

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = str(v);
  if (!s) return [];
  return s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
}

function normalizeWebsite(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s.slice(0, 255);
  return `https://${s}`.slice(0, 255);
}

function normalizePhone(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return s.replace(/[^\d+\-\s().]/g, "").trim().slice(0, 50) || null;
}

/** 0-100 completeness/quality score. */
export function qualityScore(c: NormalizedCompany): number {
  let score = 0;
  const add = (cond: unknown, pts: number) => { if (cond) score += pts; };
  add(c.name && c.name.length >= 3, 15);
  add(c.description && c.description.length >= 80, 15);
  add(c.industry, 10);
  add(c.province, 10);
  add(c.phone || c.email, 10);
  add(c.website, 8);
  add(c.address, 7);
  add(c.capabilities.length >= 2, 8);
  add(c.certifications.length >= 1, 5);
  add(c.employee_range, 4);
  add(c.founded_year, 3);
  add(c.tax_code, 3);
  add(c.logo_url, 2);
  return Math.min(score, 100);
}

export type NormalizedCompany = {
  name: string;
  slug: string;
  province: string | null;
  district: string | null;
  industry: string | null;
  sub_industry: string | null;
  employee_range: string | null;
  founded_year: number | null;
  revenue_range: string | null;
  company_type: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  tax_code: string | null;
  business_registration_number: string | null;
  legal_representative: string | null;
  capabilities: string[];
  certifications: string[];
  export_markets: string[];
};

export function normalizeCompany(raw: RawCompany): { ok: true; value: NormalizedCompany } | { ok: false; error: string } {
  const name = str(raw.name) ?? str(raw.company_name);
  if (!name) return { ok: false, error: "Thiếu trường bắt buộc: name" };

  const slug = (str(raw.slug) ? slugify(String(raw.slug)) : slugify(name)) || slugify(name);
  if (!slug) return { ok: false, error: "Không tạo được slug từ tên" };

  const yearRaw = raw.established_year ?? raw.founded_year;
  const year = Number(yearRaw);
  const employeeRaw = str(raw.employee_count) ?? str(raw.employee_range);

  return {
    ok: true,
    value: {
      name: name.slice(0, 255),
      slug,
      province: str(raw.province),
      district: str(raw.district),
      industry: str(raw.industry),
      sub_industry: str(raw.sub_industry),
      employee_range: employeeRaw ? (EMPLOYEE_MAP[employeeRaw] ?? employeeRaw) : null,
      founded_year: Number.isFinite(year) && year > 1800 && year <= new Date().getFullYear() ? year : null,
      revenue_range: str(raw.revenue_range),
      company_type: str(raw.company_type),
      website: normalizeWebsite(raw.website),
      phone: normalizePhone(raw.phone),
      email: str(raw.email)?.toLowerCase() ?? null,
      address: str(raw.address),
      description: str(raw.description),
      logo_url: str(raw.logo_url),
      cover_url: str(raw.banner_url) ?? str(raw.cover_url),
      tax_code: str(raw.tax_code),
      business_registration_number: str(raw.business_registration_number),
      legal_representative: str(raw.legal_representative) ?? str(raw.contact_name),
      capabilities: arr(raw.capabilities),
      certifications: arr(raw.certifications),
      export_markets: arr(raw.export_markets),
    },
  };
}

/** Minimal RFC-4180-ish CSV parser producing row objects. */
export function parseCsv(text: string): RawCompany[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { cur.push(field); field = ""; continue; }
    if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; continue; }
    if (ch === "\r") continue;
    field += ch;
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim().length));
  if (nonEmpty.length < 2) return [];
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return nonEmpty.slice(1).map((r) => {
    const obj: RawCompany = {};
    header.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

/** Optional AI enrichment: generates a Vietnamese summary for the profile. */
export async function enrichSummary(c: NormalizedCompany): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Bạn viết mô tả ngắn gọn (2-3 câu, tiếng Việt) về năng lực sản xuất của nhà máy cho danh bạ B2B. Chỉ trả về đoạn văn, không markdown." },
          { role: "user", content: JSON.stringify({ name: c.name, industry: c.industry, province: c.province, capabilities: c.capabilities, description: c.description, employee_range: c.employee_range }) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("[import.enrich] failed", err);
    return null;
  }
}
