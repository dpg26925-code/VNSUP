import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { abs } from "@/lib/factory";
import { Mail, Shield, Database, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => {
    const url = abs("/about");
    const title = "Giới thiệu FactoryHub Vietnam — Danh bạ nhà máy sản xuất";
    const desc = "FactoryHub Vietnam kết nối buyer với nhà máy sản xuất trên toàn quốc. Tìm hiểu sứ mệnh, chính sách dữ liệu và cách liên hệ.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">Giới thiệu FactoryHub</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Danh bạ nhà máy sản xuất Việt Nam, giúp buyer trong nước và quốc tế tìm đúng đối tác nhanh chóng, minh bạch.
        </p>

        <section className="mt-10 space-y-3">
          <div className="inline-flex items-center gap-2 text-primary"><Users className="h-5 w-5" /><h2 className="text-xl font-semibold">Sứ mệnh</h2></div>
          <p className="text-sm leading-relaxed text-foreground/90">
            Chúng tôi tin rằng ngành sản xuất Việt Nam xứng đáng có một hạ tầng dữ liệu mở, đáng tin cậy. FactoryHub tổng hợp thông tin nhà máy theo ngành và địa phương, chuẩn hóa hồ sơ và cung cấp kênh liên hệ trực tiếp cho buyer.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-primary"><Database className="h-5 w-5" /><h2 className="text-xl font-semibold">Chính sách nguồn dữ liệu</h2></div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
            <li>Dữ liệu được thu thập từ website công khai, hồ sơ doanh nghiệp niêm yết, thông cáo báo chí và hồ sơ do chính doanh nghiệp gửi.</li>
            <li>Mọi hồ sơ do người dùng gửi đều được đội ngũ biên tập duyệt trước khi hiển thị.</li>
            <li>Doanh nghiệp có thể yêu cầu cập nhật, xác thực (verified) hoặc gỡ hồ sơ bằng email bên dưới.</li>
            <li>Chúng tôi không bán dữ liệu cá nhân của buyer cho bên thứ ba.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-primary"><Shield className="h-5 w-5" /><h2 className="text-xl font-semibold">Quyền riêng tư</h2></div>
          <p className="text-sm leading-relaxed text-foreground/90">
            Yêu cầu báo giá của buyer chỉ được chuyển tới nhà máy tương ứng và đội ngũ vận hành FactoryHub. Chúng tôi lưu tối thiểu thông tin cần thiết để xử lý yêu cầu và tuân thủ quy định pháp luật hiện hành về bảo vệ dữ liệu cá nhân.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <div className="inline-flex items-center gap-2 text-primary"><Mail className="h-5 w-5" /><h2 className="text-xl font-semibold">Liên hệ</h2></div>
          <p className="text-sm leading-relaxed text-foreground/90">
            Mọi thắc mắc, hợp tác hoặc yêu cầu cập nhật dữ liệu, vui lòng gửi về{" "}
            <a href="mailto:hello@factoryhub.vn" className="font-semibold text-primary hover:underline">hello@factoryhub.vn</a>.
          </p>
          <p className="text-sm text-muted-foreground">
            Đối tác kỹ thuật quan tâm tới API tích hợp, xem <Link to="/api" className="text-primary hover:underline">tài liệu API</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
