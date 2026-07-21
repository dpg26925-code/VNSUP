import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Không có quyền truy cập" }, { name: "robots", content: "noindex" }] }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tài khoản của bạn chưa được cấp vai trò quản trị (admin/publisher/editor). Vui lòng liên hệ quản trị viên.
        </p>
        <Link to="/" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
