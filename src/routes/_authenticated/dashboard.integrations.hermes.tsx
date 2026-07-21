import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/_authenticated/dashboard/integrations/hermes")({
  head: () => ({
    meta: [
      { title: "Tích hợp Hermes | FactoryHub Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HermesIntegrationPage,
});

const BASE_URL = "https://cheerful-wave-works.lovable.app/api/public/admin";
const SUPABASE_URL = "https://fnyonwdojxkchbrqrcpu.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueW9ud2RvanhrY2hicnFyY3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODA0NDcsImV4cCI6MjA5OTM1NjQ0N30.NiaFCAuY-1-7o5H203TZ3voczi5bfn1WCu89uOztC_c";

const skillConfig = `{
  "skills": ["factoryhub-admin"],
  "factoryhub-admin": {
    "base_url": "${BASE_URL}",
    "supabase": {
      "url": "${SUPABASE_URL}",
      "anon_key": "${ANON_KEY}"
    },
    "auth": {
      "type": "supabase_password",
      "email": "HERMES_EMAIL",
      "password": "HERMES_PASSWORD"
    },
    "default_role": "editor",
    "cron_defaults": {
      "telegram_chat_id": "YOUR_CHAT_ID",
      "telegram_bot_token": "YOUR_BOT_TOKEN"
    }
  }
}`;

const loginCurl = `curl -X POST '${SUPABASE_URL}/auth/v1/token?grant_type=password' \\
  -H 'apikey: ${ANON_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"HERMES_EMAIL","password":"HERMES_PASSWORD"}'`;

const testCurl = `curl -H 'Authorization: Bearer <ACCESS_TOKEN>' \\
  '${BASE_URL}/articles?limit=5'`;

const grantSql = `INSERT INTO public.user_roles (user_id, role, allowed_categories, can_publish, can_delete)
VALUES ('<HERMES_USER_ID>', 'editor', ARRAY['tin-tuc','huong-dan'], false, false);`;

const endpoints: { tool: string; method: string; path: string; purpose: string; body?: string }[] = [
  { tool: "factoryhub_list_posts", method: "GET", path: "/articles?limit=5", purpose: "Danh sách bài" },
  { tool: "factoryhub_get_post", method: "GET", path: "/articles/:id", purpose: "Chi tiết bài" },
  { tool: "factoryhub_create_post", method: "POST", path: "/articles", purpose: "Tạo draft", body: `{\n  "title": "Bài test từ Hermes",\n  "content": "Nội dung test",\n  "category": "tin-tuc"\n}` },
  { tool: "factoryhub_update_post", method: "PATCH", path: "/articles/:id", purpose: "Sửa bài", body: `{\n  "title": "Tiêu đề mới"\n}` },
  { tool: "factoryhub_delete_post", method: "DELETE", path: "/articles/:id", purpose: "Xóa bài" },
  { tool: "factoryhub_publish_post", method: "POST", path: "/articles/:id/publish", purpose: "Publish / Unpublish", body: `{ "publish": true }` },
  { tool: "factoryhub_list_categories", method: "GET", path: "/categories", purpose: "Danh sách chuyên mục" },
  { tool: "factoryhub_list_leads", method: "GET", path: "/leads?limit=10", purpose: "Xem leads" },
  { tool: "factoryhub_analytics", method: "GET", path: "/analytics/summary", purpose: "Thống kê" },
];


function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function HermesIntegrationPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tích hợp</p>
        <h1 className="text-2xl font-bold">Hermes → FactoryHub Admin API</h1>
        <p className="text-sm text-muted-foreground">
          Hướng dẫn kết nối Hermes với Admin API v2 đang chạy trên TanStack server routes (không cần deploy Edge Function).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Skill config</h2>
        <p className="text-sm text-muted-foreground">Thêm block sau vào file config skills của Hermes:</p>
        <Code>{skillConfig}</Code>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Auth flow</h2>
        <p className="text-sm text-muted-foreground">
          Mọi request phải kèm <code className="rounded bg-muted px-1">Authorization: Bearer &lt;access_token&gt;</code>.
          Hermes login bằng Supabase Auth:
        </p>
        <Code>{loginCurl}</Code>
        <p className="text-sm text-muted-foreground">
          Lưu <code className="rounded bg-muted px-1">access_token</code> vào session. Khi nhận 401 → refresh hoặc login lại.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Cấp quyền cho user Hermes</h2>
        <p className="text-sm text-muted-foreground">
          Chạy trong Supabase SQL Editor, thay <code className="rounded bg-muted px-1">&lt;HERMES_USER_ID&gt;</code> bằng UID
          trong <code className="rounded bg-muted px-1">auth.users</code>:
        </p>
        <Code>{grantSql}</Code>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Endpoints</h2>
        <p className="text-sm text-muted-foreground">
          Base URL: <code className="rounded bg-muted px-1">{BASE_URL}</code>
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Tool</th>
                <th className="p-3 font-medium">Method</th>
                <th className="p-3 font-medium">Endpoint</th>
                <th className="p-3 font-medium">Mục đích</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={e.tool} className="border-t">
                  <td className="p-3 font-mono text-xs">{e.tool}</td>
                  <td className="p-3 font-mono text-xs">{e.method}</td>
                  <td className="p-3 font-mono text-xs">{e.path}</td>
                  <td className="p-3">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Test connection</h2>
        <p className="text-sm text-muted-foreground">Sau khi có token, kiểm tra bằng:</p>
        <Code>{testCurl}</Code>
        <p className="text-sm text-muted-foreground">
          Response mong đợi: <code className="rounded bg-muted px-1">{`{ "data": [...], "count": N, "limit": 5, "offset": 0 }`}</code>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Ví dụ luồng đăng bài</h2>
        <ol className="list-decimal space-y-1 pl-6 text-sm">
          <li>User: "Đăng bài Top 10 nhà máy CNC Đồng Nai"</li>
          <li>Hermes login → lấy access_token</li>
          <li>POST <code className="rounded bg-muted px-1">/articles</code> với status = <code className="rounded bg-muted px-1">draft</code></li>
          <li>Admin duyệt → Hermes gọi <code className="rounded bg-muted px-1">/articles/:id/publish</code></li>
          <li>Bài xuất hiện trên website + ghi vào <code className="rounded bg-muted px-1">admin_audit_log</code></li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Troubleshooting</h2>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><b>401 Unauthorized</b> — thiếu Bearer token, token hết hạn, hoặc sai anon key trong header <code className="rounded bg-muted px-1">apikey</code> khi login.</li>
          <li><b>403 forbidden</b> — user chưa có row trong <code className="rounded bg-muted px-1">user_roles</code>, hoặc thao tác ngoài <code className="rounded bg-muted px-1">allowed_categories</code>, hoặc thiếu <code className="rounded bg-muted px-1">can_publish</code>/<code className="rounded bg-muted px-1">can_delete</code>.</li>
          <li><b>409 insert_failed</b> — trùng <code className="rounded bg-muted px-1">slug</code>. Gửi lại với slug khác.</li>
          <li><b>400 validation</b> — thiếu <code className="rounded bg-muted px-1">title</code> (POST) hoặc <code className="rounded bg-muted px-1">title + content</code> (PUT).</li>
        </ul>
      </section>
    </div>
  );
}
