import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, logAudit, requireAdmin } from "@/lib/admin-api.server";
import {
  enrichSummary,
  normalizeCompany,
  normalizeOptions,
  parseCsv,
  qualityScore,
  type ImportResultRow,
  type RawCompany,
} from "@/lib/company-import.server";

const MAX_ROWS = 500;

export const Route = createFileRoute("/api/public/admin/companies/batch")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      // GET /api/public/admin/companies/batch?limit=20 — import history
      GET: async ({ request }) => {
        const ctx = await requireAdmin(request, "admin");
        if (ctx instanceof Response) return ctx;

        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 100);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("import_logs")
          .select("import_id,source,summary,options,performed_by,performed_at")
          .order("performed_at", { ascending: false })
          .limit(limit);
        if (error) return json({ error: "query_failed", message: error.message }, 500);
        return json({ data });
      },

      // POST /api/public/admin/companies/batch — import JSON or CSV
      POST: async ({ request }) => {
        const ctx = await requireAdmin(request, "admin");
        if (ctx instanceof Response) return ctx;

        const contentType = request.headers.get("content-type") ?? "";
        let rawCompanies: RawCompany[] = [];
        let optionsRaw: unknown = {};

        try {
          if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
            rawCompanies = parseCsv(await request.text());
            const url = new URL(request.url);
            optionsRaw = {
              auto_publish: url.searchParams.get("auto_publish") === "true",
              skip_duplicates: url.searchParams.get("skip_duplicates") !== "false",
              enrich_with_ai: url.searchParams.get("enrich_with_ai") === "true",
              min_quality_score: Number(url.searchParams.get("min_quality_score") ?? 0),
            };
          } else {
            const body = (await request.json()) as { companies?: unknown; csv?: unknown; options?: unknown };
            optionsRaw = body.options ?? {};
            if (typeof body.csv === "string") rawCompanies = parseCsv(body.csv);
            else if (Array.isArray(body.companies)) rawCompanies = body.companies as RawCompany[];
          }
        } catch (err) {
          return json({ error: "invalid_body", message: (err as Error).message }, 400);
        }

        if (!Array.isArray(rawCompanies) || rawCompanies.length === 0) {
          return json({ error: "invalid_body", message: "Cần mảng 'companies' hoặc chuỗi 'csv' không rỗng." }, 400);
        }
        if (rawCompanies.length > MAX_ROWS) {
          return json({ error: "too_many_rows", message: `Tối đa ${MAX_ROWS} doanh nghiệp mỗi lần.` }, 413);
        }

        const options = normalizeOptions(optionsRaw);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: ImportResultRow[] = [];
        const scores: number[] = [];

        for (const raw of rawCompanies) {
          const norm = normalizeCompany(raw);
          if (!norm.ok) {
            results.push({ name: String(raw?.name ?? "(không tên)"), slug: null, status: "error", reason: "validation", message: norm.error });
            continue;
          }
          const c = norm.value;
          const score = qualityScore(c);
          scores.push(score);

          if (score < options.min_quality_score) {
            results.push({ name: c.name, slug: c.slug, status: "skipped", score, reason: "low_quality", message: `Điểm chất lượng ${score} < ngưỡng ${options.min_quality_score}` });
            continue;
          }

          // Duplicate detection: slug, then tax_code, then phone.
          let existing: { id: string; slug: string } | null = null;
          const bySlug = await supabaseAdmin.from("companies").select("id,slug").eq("slug", c.slug).maybeSingle();
          existing = bySlug.data ?? null;
          if (!existing && c.tax_code) {
            const byTax = await supabaseAdmin.from("companies").select("id,slug").eq("tax_code", c.tax_code).maybeSingle();
            existing = byTax.data ?? null;
          }
          if (!existing && c.phone) {
            const byPhone = await supabaseAdmin.from("companies").select("id,slug").eq("phone", c.phone).maybeSingle();
            existing = byPhone.data ?? null;
          }

          if (existing && options.skip_duplicates) {
            results.push({ name: c.name, slug: existing.slug, status: "skipped", id: existing.id, score, reason: "duplicate", message: `Đã tồn tại với slug '${existing.slug}'` });
            continue;
          }

          let aiSummary: string | null = null;
          if (options.enrich_with_ai) aiSummary = await enrichSummary(c);

          if (options.dry_run) {
            results.push({ name: c.name, slug: c.slug, status: existing ? "updated" : "imported", score, message: "Dry-run: không ghi dữ liệu" });
            continue;
          }

          const payload: Record<string, unknown> = {
            name: c.name,
            province: c.province,
            district: c.district,
            industry: c.industry,
            sub_industry: c.sub_industry,
            employee_range: c.employee_range,
            founded_year: c.founded_year,
            revenue_range: c.revenue_range,
            company_type: c.company_type,
            website: c.website,
            phone: c.phone,
            email: c.email,
            address: c.address,
            description: c.description,
            logo_url: c.logo_url,
            cover_url: c.cover_url,
            tax_code: c.tax_code,
            business_registration_number: c.business_registration_number,
            legal_representative: c.legal_representative,
            capabilities: c.capabilities,
            certifications: c.certifications.map((name) => ({ name })),
            export_markets: c.export_markets,
            source: "hermes",
            status: options.auto_publish ? "approved" : "pending",
          };
          if (aiSummary) payload.ai_summary = aiSummary;

          if (existing) {
            const { error } = await supabaseAdmin.from("companies").update(payload as never).eq("id", existing.id);
            if (error) {
              results.push({ name: c.name, slug: c.slug, status: "error", score, reason: "db_error", message: error.message });
              continue;
            }
            results.push({ name: c.name, slug: existing.slug, status: "updated", id: existing.id, score, message: "Cập nhật thành công" });
          } else {
            const { data, error } = await supabaseAdmin
              .from("companies")
              .insert({ ...payload, slug: c.slug } as never)
              .select("id,slug")
              .single();
            if (error) {
              results.push({ name: c.name, slug: c.slug, status: "error", score, reason: "db_error", message: error.message });
              continue;
            }
            results.push({ name: c.name, slug: data.slug, status: "imported", id: data.id, score, message: "Imported successfully" });
          }
        }

        const summary = {
          total: rawCompanies.length,
          imported: results.filter((r) => r.status === "imported").length,
          updated: results.filter((r) => r.status === "updated").length,
          skipped: results.filter((r) => r.status === "skipped").length,
          errors: results.filter((r) => r.status === "error").length,
          avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        };

        const importId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const { error: logErr } = await supabaseAdmin.from("import_logs").insert({
          import_id: importId,
          source: "hermes",
          summary: summary as never,
          results: results as never,
          options: options as never,
          performed_by: ctx.userId,
        });
        if (logErr) console.error("[import.log] failed", logErr);

        await logAudit(ctx, "companies.batch_import", { type: "companies" }, { import_id: importId, ...summary });

        if (options.notify_on_complete) await notify(importId, summary);

        return json({ import_id: importId, summary, results });
      },
    },
  },
});

async function notify(importId: string, summary: Record<string, number>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `VNSupplier import ${importId}\nMới: ${summary.imported} · Cập nhật: ${summary.updated} · Bỏ qua: ${summary.skipped} · Lỗi: ${summary.errors}\nĐiểm TB: ${summary.avg_score}`,
      }),
    });
  } catch (err) {
    console.error("[import.notify] failed", err);
  }
}
