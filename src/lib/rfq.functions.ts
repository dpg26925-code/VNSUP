import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubmitInquiryInput = z.object({
  companyId: z.string().uuid("ID công ty không hợp lệ"),
  name: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").max(100),
  email: z.string().trim().email("Email không hợp lệ").max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  company: z.string().trim().min(2, "Tên công ty tối thiểu 2 ký tự").max(150),
  message: z.string().trim().min(10, "Nội dung yêu cầu tối thiểu 10 ký tự").max(3000),
  sourcePage: z.string().optional().nullable(),
});

/**
 * Gửi yêu cầu báo giá (RFQ / Inquiry) từ Buyer tới Nhà máy
 * Chạy trên Cloudflare Worker (Public RPC)
 */
export const submitInquiry = createServerFn({ method: "POST" })
  .validator((raw) => SubmitInquiryInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Lấy thông tin công ty tiếp nhận
    const { data: targetCompany, error: coErr } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug, email, submitted_by")
      .eq("id", data.companyId)
      .maybeSingle();

    if (coErr || !targetCompany) {
      throw new Error("Không tìm thấy thông tin nhà máy tiếp nhận yêu cầu.");
    }

    // 2. Lưu bản ghi Lead vào Database
    const { data: leadRow, error: insertErr } = await supabaseAdmin
      .from("leads")
      .insert({
        company_id: data.companyId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company,
        message: data.message,
        source_page: data.sourcePage ?? `/company/${targetCompany.slug}`,
      })
      .select("id, created_at")
      .single();

    if (insertErr || !leadRow) {
      throw new Error(`Gửi yêu cầu thất bại: ${insertErr?.message ?? "Lỗi lưu dữ liệu"}`);
    }

    // 3. Best-effort: Gửi email thông báo cho Chủ nhà máy qua Lovable Email Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        let recipientEmail = targetCompany.email;

        // Nếu công ty có owner đăng ký qua user_id, lấy email tài khoản owner
        if (targetCompany.submitted_by) {
          const { data: ownerUser } = await supabaseAdmin.auth.admin.getUserById(targetCompany.submitted_by);
          if (ownerUser?.user?.email) {
            recipientEmail = ownerUser.user.email;
          }
        }

        // Gửi email cho Chủ nhà máy / Sales
        if (recipientEmail) {
          await fetch("https://api.lovable.dev/v1/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              to: recipientEmail,
              subject: `[VNSupplier] Yêu cầu báo giá mới từ ${data.name} (${data.company})`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #ea580c; margin-top: 0;">Yêu cầu báo giá (RFQ) mới</h2>
                  <p>Nhà máy <strong>${targetCompany.name}</strong> vừa nhận được một yêu cầu báo giá từ khách hàng trên hệ thống VNSupplier:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f8fafc;"><td style="padding: 10px; font-weight: bold; width: 140px;">Người gửi:</td><td style="padding: 10px;">${data.name}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Công ty / Đơn vị:</td><td style="padding: 10px;">${data.company}</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
                    <tr><td style="padding: 10px; font-weight: bold;">Số điện thoại:</td><td style="padding: 10px;">${data.phone || "Không cung cấp"}</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 10px; font-weight: bold; vertical-align: top;">Nội dung nhu cầu:</td><td style="padding: 10px; white-space: pre-wrap;">${data.message}</td></tr>
                  </table>
                  <p style="margin-top: 25px;"><a href="https://vnsupplier.cloud/dashboard/leads" style="display: inline-block; background: #ea580c; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Truy cập Hộp thư Leads Dashboard →</a></p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
                  <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ nền tảng B2B VNSupplier.cloud. Vui lòng phản hồi khách hàng trong vòng 24h để tăng tỷ lệ chốt đơn.</p>
                </div>
              `,
            }),
          }).catch((err) => console.warn("[rfq-email-owner] Email send warning:", err));
        }

        // Gửi email xác nhận tiếp nhận cho Buyer
        await fetch("https://api.lovable.dev/v1/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            to: data.email,
            subject: `[VNSupplier] Đã gửi yêu cầu báo giá tới ${targetCompany.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981; margin-top: 0;">✓ Yêu cầu báo giá đã được gửi thành công</h2>
                <p>Kính chào <strong>${data.name}</strong>,</p>
                <p>Yêu cầu báo giá của bạn đã được chuyển thẳng tới phòng kinh doanh của <strong>${targetCompany.name}</strong>.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #334155;">Nội dung bạn đã gửi:</p>
                  <p style="margin: 0; font-size: 14px; color: #475569; white-space: pre-wrap;">${data.message}</p>
                </div>
                <p>Đại diện nhà máy sẽ phản hồi lại bạn qua email hoặc số điện thoại bạn đã cung cấp trong thời gian sớm nhất (thường trong 24 giờ làm việc).</p>
                <p style="margin-top: 25px;"><a href="https://vnsupplier.cloud/company/${targetCompany.slug}" style="color: #ea580c; font-weight: bold; text-decoration: none;">Xem lại hồ sơ nhà máy ${targetCompany.name} →</a></p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
                <p style="font-size: 12px; color: #64748b;">VNSupplier.cloud — Nền tảng kết nối chuỗi cung ứng sản xuất Việt Nam.</p>
              </div>
            `,
          }),
        }).catch((err) => console.warn("[rfq-email-buyer] Confirmation send warning:", err));
      } catch (emailErr) {
        console.warn("[rfq-email] Best effort email error:", emailErr);
      }
    }

    return {
      success: true,
      leadId: leadRow.id,
      companyName: targetCompany.name,
    };
  });

/**
 * Lấy danh sách leads cho người dùng hiện tại:
 * - Admin: xem tất cả leads
 * - Company Owner: xem leads gửi tới các nhà máy của mình
 */
export const getMyCompanyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Kiểm tra quyền admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "publisher", "editor"])
      .maybeSingle();

    if (adminRole) {
      const { data: allLeads } = await supabaseAdmin
        .from("leads")
        .select("id, name, email, phone, company, message, created_at, source_page, company_id, companies(id, name, slug)")
        .order("created_at", { ascending: false })
        .limit(200);

      return {
        isAdmin: true,
        leads: allLeads ?? [],
      };
    }

    // 2. Lấy các công ty của user (submitted_by hoặc approved claims)
    const [subRes, claimRes] = await Promise.all([
      supabaseAdmin.from("companies").select("id, name, slug").eq("submitted_by", context.userId),
      supabaseAdmin.from("company_claims").select("company_id, companies(id, name, slug)").eq("user_id", context.userId).eq("status", "approved"),
    ]);

    const ownedCompanyIds = new Set<string>();
    const companyMap = new Map<string, { id: string; name: string; slug: string }>();

    for (const c of subRes.data ?? []) {
      ownedCompanyIds.add(c.id);
      companyMap.set(c.id, c);
    }
    for (const cl of claimRes.data ?? []) {
      if (cl.company_id) {
        ownedCompanyIds.add(cl.company_id);
        if (cl.companies) companyMap.set(cl.company_id, cl.companies as any);
      }
    }

    if (ownedCompanyIds.size === 0) {
      return {
        isAdmin: false,
        leads: [],
      };
    }

    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("id, name, email, phone, company, message, created_at, source_page, company_id, companies(id, name, slug)")
      .in("company_id", Array.from(ownedCompanyIds))
      .order("created_at", { ascending: false })
      .limit(100);

    return {
      isAdmin: false,
      leads: leads ?? [],
    };
  });
