import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProductInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  moq: z.string().nullable().optional(),
  lead_time: z.string().nullable().optional(),
  price_range: z.string().nullable().optional(),
  catalog_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  sort_order: z.number().optional().default(0),
});

const ContactInputSchema = z.object({
  id: z.string().optional(),
  contact_type: z.string().min(1),
  value: z.string().min(1, "Giá trị liên hệ không được để trống"),
  label: z.string().nullable().optional(),
  verified: z.boolean().optional().default(false),
});

const CertificationInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên chứng chỉ không được để trống"),
  issuer: z.string().nullable().optional(),
  certificate_url: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  verification_status: z.string().optional().default("pending"),
  sort_order: z.number().optional().default(0),
});

const GalleryInputSchema = z.object({
  id: z.string().optional(),
  image_url: z.string().url("URL ảnh không hợp lệ"),
  caption: z.string().nullable().optional(),
  sort_order: z.number().optional().default(0),
});

const CompanyProfilePatchSchema = z.object({
  name: z.string().min(2, "Tên doanh nghiệp tối thiểu 2 ký tự").optional(),
  slug: z.string().min(2).optional(),
  tax_code: z.string().nullable().optional(),
  business_registration_number: z.string().nullable().optional(),
  legal_representative: z.string().nullable().optional(),
  founded_year: z.number().nullable().optional(),
  employee_range: z.string().nullable().optional(),
  revenue_range: z.string().nullable().optional(),
  company_type: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  sub_industry: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  stock_exchange: z.string().nullable().optional(),
  stock_ticker: z.string().nullable().optional(),
  capabilities: z.array(z.string()).optional(),
});

/**
 * Kiểm tra quyền sở hữu công ty của user
 */
async function verifyCompanyOwnership(supabaseAdmin: any, companyId: string, userId: string): Promise<boolean> {
  // 1. Kiểm tra quyền admin
  const { data: adminRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "publisher", "editor"])
    .maybeSingle();

  if (adminRole) return true;

  // 2. Kiểm tra submitted_by
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id, submitted_by")
    .eq("id", companyId)
    .maybeSingle();

  if (company && company.submitted_by === userId) return true;

  // 3. Kiểm tra claim đã approved
  const { data: claim } = await supabaseAdmin
    .from("company_claims")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  if (claim) return true;

  return false;
}

/**
 * Lấy toàn bộ dữ liệu chi tiết của công ty (hồ sơ + sản phẩm + chứng chỉ + ảnh + liên hệ)
 */
export const getMyCompanyDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw) => z.object({ companyId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền quản lý hồ sơ doanh nghiệp này.");
    }

    const [
      companyRes,
      productsRes,
      contactsRes,
      certificationsRes,
      galleryRes,
      videosRes,
      faqsRes,
      marketsRes,
      leadsRes,
    ] = await Promise.all([
      supabaseAdmin.from("companies").select("*").eq("id", data.companyId).maybeSingle(),
      supabaseAdmin.from("products").select("*").eq("company_id", data.companyId).order("created_at", { ascending: false }),
      supabaseAdmin.from("company_contacts").select("*").eq("company_id", data.companyId),
      supabaseAdmin.from("certifications").select("*").eq("company_id", data.companyId).order("sort_order"),
      supabaseAdmin.from("company_gallery").select("*").eq("company_id", data.companyId).order("sort_order"),
      supabaseAdmin.from("company_videos").select("*").eq("company_id", data.companyId).order("sort_order"),
      supabaseAdmin.from("company_faqs").select("*").eq("company_id", data.companyId).order("sort_order"),
      supabaseAdmin.from("company_export_markets").select("*").eq("company_id", data.companyId).order("sort_order"),
      supabaseAdmin.from("leads").select("id, name, email, phone, company, message, created_at, source_page").eq("company_id", data.companyId).order("created_at", { ascending: false }).limit(50),
    ]);

    if (!companyRes.data) {
      throw new Error("Không tìm thấy thông tin công ty.");
    }

    return {
      company: companyRes.data,
      products: productsRes.data ?? [],
      contacts: contactsRes.data ?? [],
      certifications: certificationsRes.data ?? [],
      gallery: galleryRes.data ?? [],
      videos: videosRes.data ?? [],
      faqs: faqsRes.data ?? [],
      exportMarkets: marketsRes.data ?? [],
      leads: leadsRes.data ?? [],
    };
  });

/**
 * Cập nhật thông tin chung của hồ sơ công ty
 */
export const updateCompanyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw) =>
    z
      .object({
        companyId: z.string().uuid(),
        patch: CompanyProfilePatchSchema,
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền chỉnh sửa doanh nghiệp này.");
    }

    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        ...data.patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.companyId);

    if (error) {
      throw new Error(`Cập nhật thất bại: ${error.message}`);
    }

    return { success: true };
  });

/**
 * Lưu danh mục sản phẩm (CRUD trọn gói)
 */
export const syncCompanyProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw) =>
    z
      .object({
        companyId: z.string().uuid(),
        products: z.array(ProductInputSchema),
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền chỉnh sửa sản phẩm của doanh nghiệp này.");
    }

    // Xóa sản phẩm cũ và thêm mới
    const { error: delErr } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("company_id", data.companyId);

    if (delErr) {
      throw new Error(`Lỗi cập nhật sản phẩm: ${delErr.message}`);
    }

    if (data.products.length > 0) {
      const rows = data.products.map((p) => ({
        company_id: data.companyId,
        name: p.name,
        category: p.category ?? null,
        description: p.description ?? null,
        moq: p.moq ?? null,
        lead_time: p.lead_time ?? null,
        price_range: p.price_range ?? null,
        catalog_url: p.catalog_url ?? null,
        image_url: p.image_url ?? null,
      }));

      const { error: insErr } = await supabaseAdmin.from("products").insert(rows);
      if (insErr) {
        throw new Error(`Lỗi thêm mới sản phẩm: ${insErr.message}`);
      }
    }

    return { success: true, count: data.products.length };
  });

/**
 * Lưu danh sách liên hệ (Hotline, Email, Zalo, Địa chỉ)
 */
export const syncCompanyContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw) =>
    z
      .object({
        companyId: z.string().uuid(),
        contacts: z.array(ContactInputSchema),
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền chỉnh sửa liên hệ của doanh nghiệp này.");
    }

    const { error: delErr } = await supabaseAdmin
      .from("company_contacts")
      .delete()
      .eq("company_id", data.companyId);

    if (delErr) {
      throw new Error(`Lỗi cập nhật liên hệ: ${delErr.message}`);
    }

    if (data.contacts.length > 0) {
      const rows = data.contacts.map((c) => ({
        company_id: data.companyId,
        contact_type: c.contact_type,
        value: c.value,
        label: c.label ?? null,
        verified: c.verified ?? false,
      }));

      const { error: insErr } = await supabaseAdmin.from("company_contacts").insert(rows);
      if (insErr) {
        throw new Error(`Lỗi thêm liên hệ: ${insErr.message}`);
      }
    }

    return { success: true, count: data.contacts.length };
  });

/**
 * Lưu danh sách chứng chỉ (ISO, CE, FDA, SGS...)
 */
export const syncCompanyCertifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw) =>
    z
      .object({
        companyId: z.string().uuid(),
        certifications: z.array(CertificationInputSchema),
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền chỉnh sửa chứng chỉ.");
    }

    const { error: delErr } = await supabaseAdmin
      .from("certifications")
      .delete()
      .eq("company_id", data.companyId);

    if (delErr) {
      throw new Error(`Lỗi cập nhật chứng chỉ: ${delErr.message}`);
    }

    if (data.certifications.length > 0) {
      const rows = data.certifications.map((c, idx) => ({
        company_id: data.companyId,
        name: c.name,
        issuer: c.issuer ?? null,
        certificate_url: c.certificate_url ?? null,
        issued_at: c.issued_at || null,
        expires_at: c.expires_at || null,
        verification_status: c.verification_status ?? "pending",
        sort_order: c.sort_order ?? idx,
      }));

      const { error: insErr } = await supabaseAdmin.from("certifications").insert(rows);
      if (insErr) {
        throw new Error(`Lỗi thêm chứng chỉ: ${insErr.message}`);
      }
    }

    return { success: true, count: data.certifications.length };
  });

/**
 * Lưu danh sách ảnh thư viện nhà máy
 */
export const syncCompanyGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw) =>
    z
      .object({
        companyId: z.string().uuid(),
        gallery: z.array(GalleryInputSchema),
      })
      .parse(raw)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const hasAccess = await verifyCompanyOwnership(supabaseAdmin, data.companyId, context.userId);
    if (!hasAccess) {
      throw new Error("Bạn không có quyền chỉnh sửa thư viện ảnh.");
    }

    const { error: delErr } = await supabaseAdmin
      .from("company_gallery")
      .delete()
      .eq("company_id", data.companyId);

    if (delErr) {
      throw new Error(`Lỗi cập nhật ảnh: ${delErr.message}`);
    }

    if (data.gallery.length > 0) {
      const rows = data.gallery.map((g, idx) => ({
        company_id: data.companyId,
        image_url: g.image_url,
        caption: g.caption ?? null,
        sort_order: g.sort_order ?? idx,
      }));

      const { error: insErr } = await supabaseAdmin.from("company_gallery").insert(rows);
      if (insErr) {
        throw new Error(`Lỗi lưu ảnh: ${insErr.message}`);
      }
    }

    return { success: true, count: data.gallery.length };
  });
