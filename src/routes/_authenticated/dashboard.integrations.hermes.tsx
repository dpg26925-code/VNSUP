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
          Chọn vai trò và phạm vi bên dưới, hệ thống sẽ sinh SQL tương ứng để bạn copy vào Supabase SQL Editor.
        </p>
        <RoleGrantBuilder />
        <details className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-medium">Ví dụ mẫu (editor + 2 chuyên mục)</summary>
          <div className="mt-2"><Code>{grantSql}</Code></div>
        </details>
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

        <div className="mt-4 rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Test nhanh trong trình duyệt</h3>
            <span className="text-xs text-muted-foreground">Tự dùng session admin hiện tại</span>
          </div>
          <EndpointTester />
        </div>
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

function EndpointTester() {
  const [idx, setIdx] = useState(0);
  const [pathInput, setPathInput] = useState(endpoints[0].path);
  const [method, setMethod] = useState(endpoints[0].method === "PATCH" ? "PATCH" : endpoints[0].method);
  const [body, setBody] = useState(endpoints[0].body ?? "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [response, setResponse] = useState<string>("");

  const onPick = (i: number) => {
    setIdx(i);
    const e = endpoints[i];
    setPathInput(e.path);
    setMethod(e.method);
    setBody(e.body ?? "");
    setStatus(null);
    setResponse("");
  };

  const run = async () => {
    setLoading(true);
    setStatus(null);
    setResponse("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setResponse("Chưa có session — vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }
      const url = `${BASE_URL}${pathInput.startsWith("/") ? pathInput : `/${pathInput}`}`;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      let payload: BodyInit | undefined;
      if (method !== "GET" && method !== "DELETE" && body.trim()) {
        headers["Content-Type"] = "application/json";
        payload = body;
      }
      const res = await fetch(url, { method, headers, body: payload });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const needsBody = method !== "GET" && method !== "DELETE";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {endpoints.map((e, i) => (
          <button
            key={e.tool}
            type="button"
            onClick={() => onPick(i)}
            className={`rounded-md border px-2.5 py-1 text-xs font-mono transition ${
              idx === i ? "border-primary bg-primary/10" : "hover:bg-muted"
            }`}
          >
            {e.method} {e.path.split("?")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {["GET", "POST", "PATCH", "PUT", "DELETE"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="/articles?limit=5"
          className="rounded-md border bg-background px-3 py-1.5 text-sm font-mono"
        />
      </div>

      {needsBody && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder='{"title": "..."}'
          className="w-full rounded-md border bg-background p-2 text-xs font-mono"
        />
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? "Đang gọi..." : "Gửi request"}
        </Button>
        {status !== null && (
          <span
            className={`text-xs font-mono ${
              status >= 200 && status < 300 ? "text-green-600" : "text-destructive"
            }`}
          >
            HTTP {status}
          </span>
        )}
        <span className="text-xs text-muted-foreground truncate">
          {method} {BASE_URL}{pathInput.startsWith("/") ? pathInput : `/${pathInput}`}
        </span>
      </div>

      {response && (
        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs">
          <code>{response}</code>
        </pre>
      )}
    </div>
  );
}

type RoleKey = "admin" | "publisher" | "editor" | "user" | "viewer";

function RoleGrantBuilder() {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<RoleKey>("editor");
  const [categories, setCategories] = useState("tin-tuc, huong-dan");
  const [canPublish, setCanPublish] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [copied, setCopied] = useState(false);

  const uid = userId.trim() || "<HERMES_USER_ID>";
  const cats = categories
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const needsCats = role === "editor" && cats.length > 0;
  const catsSql = needsCats
    ? `ARRAY[${cats.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")}]`
    : "NULL";

  const sql = `-- Cấp quyền '${role}' cho user Hermes
INSERT INTO public.user_roles (
  user_id, role, allowed_categories, can_publish, can_delete, can_manage_users
) VALUES (
  '${uid}',
  '${role}',
  ${catsSql},
  ${canPublish},
  ${canDelete},
  ${canManageUsers}
)
ON CONFLICT (user_id, role) DO UPDATE SET
  allowed_categories = EXCLUDED.allowed_categories,
  can_publish        = EXCLUDED.can_publish,
  can_delete         = EXCLUDED.can_delete,
  can_manage_users   = EXCLUDED.can_manage_users;`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">User ID (auth.users.id)</span>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Vai trò</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleKey)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {(["admin", "publisher", "editor", "user", "viewer"] as RoleKey[]).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">
          Chuyên mục được phép <span className="text-muted-foreground">(chỉ áp dụng cho editor, cách nhau bằng dấu phẩy)</span>
        </span>
        <input
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="tin-tuc, huong-dan"
          disabled={role !== "editor"}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm font-mono disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={canPublish} onChange={(e) => setCanPublish(e.target.checked)} />
          can_publish
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
          can_delete
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={canManageUsers} onChange={(e) => setCanManageUsers(e.target.checked)} />
          can_manage_users
        </label>
      </div>

      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
        <code>{sql}</code>
      </pre>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={copy}>{copied ? "Đã copy ✓" : "Copy SQL"}</Button>
        <span className="text-xs text-muted-foreground">
          Dán vào Supabase → SQL Editor → Run
        </span>
      </div>
    </div>
  );
}


