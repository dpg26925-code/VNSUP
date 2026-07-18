import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, ArrowLeft, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Quản lý — Người nổi tiếng" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Celeb = {
  id: string;
  slug: string;
  name: string;
  stage_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  nationality: string | null;
  birth_date: string | null;
  category: string;
  achievements: string[];
  socials: Record<string, string>;
  featured: boolean;
  published: boolean;
};

const emptyForm: Omit<Celeb, "id"> = {
  slug: "",
  name: "",
  stage_name: "",
  avatar_url: "",
  cover_url: "",
  bio: "",
  nationality: "",
  birth_date: "",
  category: "singer",
  achievements: [],
  socials: {},
  featured: false,
  published: true,
};

function AdminPage() {
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<Celeb | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setIsAdmin(false);
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!role);
    });
  }, []);

  const { data: celebs = [], refetch } = useQuery({
    queryKey: ["admin-celebrities"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("celebrities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Celeb[];
    },
  });

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="p-10 text-center text-sm text-muted-foreground">
          Đang kiểm tra quyền…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-primary/70" />
          <h1 className="mt-4 text-2xl font-bold">Bạn không phải Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Để truy cập trang quản lý, tài khoản của bạn cần có vai trò{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">admin</code>{" "}
            trong bảng <code>user_roles</code>.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Chạy SQL sau trong Supabase (thay bằng user_id của bạn):
            <br />
            <code className="mt-2 inline-block rounded bg-white/10 px-2 py-1 text-[11px]">
              INSERT INTO user_roles (user_id, role) VALUES
              ('&lt;your-uid&gt;', 'admin');
            </code>
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa nhân vật này?")) return;
    const { error } = await supabase.from("celebrities").delete().eq("id", id);
    if (error) alert(error.message);
    else {
      refetch();
      qc.invalidateQueries({ queryKey: ["celebrities"] });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Shield className="h-6 w-6 text-primary" /> Quản lý người nổi tiếng
            </h1>
            <p className="text-sm text-muted-foreground">
              {celebs.length} hồ sơ · thêm, sửa, xóa
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Thêm mới
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Lĩnh vực</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {celebs.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.avatar_url && (
                        <img
                          src={c.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <span>{c.stage_name || c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3">{c.category}</td>
                  <td className="px-4 py-3">
                    {c.published ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        Đã xuất bản
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        Nháp
                      </span>
                    )}
                    {c.featured && (
                      <span className="ml-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-300">
                        ★
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className="mr-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                    >
                      <Pencil className="h-3 w-3" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive hover:bg-destructive/30"
                    >
                      <Trash2 className="h-3 w-3" /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {celebs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Chưa có nhân vật nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CelebForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
            qc.invalidateQueries({ queryKey: ["celebrities"] });
          }}
        />
      )}
    </div>
  );
}

function CelebForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Celeb | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Celeb, "id">>(() =>
    initial
      ? {
          slug: initial.slug,
          name: initial.name,
          stage_name: initial.stage_name ?? "",
          avatar_url: initial.avatar_url ?? "",
          cover_url: initial.cover_url ?? "",
          bio: initial.bio ?? "",
          nationality: initial.nationality ?? "",
          birth_date: initial.birth_date ?? "",
          category: initial.category,
          achievements: initial.achievements ?? [],
          socials: initial.socials ?? {},
          featured: initial.featured,
          published: initial.published,
        }
      : emptyForm
  );
  const [achievementText, setAchievementText] = useState(
    (initial?.achievements ?? []).join("\n")
  );
  const [socialsText, setSocialsText] = useState(
    Object.entries(initial?.socials ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const achievements = achievementText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const socials: Record<string, string> = {};
    for (const line of socialsText.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) socials[k] = v;
      }
    }

    const payload = {
      ...form,
      stage_name: form.stage_name || null,
      avatar_url: form.avatar_url || null,
      cover_url: form.cover_url || null,
      bio: form.bio || null,
      nationality: form.nationality || null,
      birth_date: form.birth_date || null,
      achievements,
      socials,
    };

    const { error } = initial
      ? await supabase.from("celebrities").update(payload).eq("id", initial.id)
      : await supabase.from("celebrities").insert(payload);

    setSaving(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {initial ? "Sửa" : "Thêm"} nhân vật
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug (URL)*">
            <input
              required
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase() })
              }
              placeholder="son-tung-mtp"
              className="input"
            />
          </Field>
          <Field label="Lĩnh vực*">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input"
            >
              <option value="singer">Ca sĩ</option>
              <option value="actor">Diễn viên</option>
              <option value="athlete">Vận động viên</option>
              <option value="entrepreneur">Doanh nhân</option>
              <option value="influencer">KOL</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Tên thật*">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Nghệ danh">
            <input
              value={form.stage_name ?? ""}
              onChange={(e) =>
                setForm({ ...form, stage_name: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Quốc tịch">
            <input
              value={form.nationality ?? ""}
              onChange={(e) =>
                setForm({ ...form, nationality: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Ngày sinh">
            <input
              type="date"
              value={form.birth_date ?? ""}
              onChange={(e) =>
                setForm({ ...form, birth_date: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Ảnh đại diện (URL)">
            <input
              value={form.avatar_url ?? ""}
              onChange={(e) =>
                setForm({ ...form, avatar_url: e.target.value })
              }
              className="input"
            />
          </Field>
          <Field label="Ảnh bìa (URL)">
            <input
              value={form.cover_url ?? ""}
              onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <Field label="Tiểu sử" className="mt-3">
          <textarea
            rows={5}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Thành tích (mỗi dòng 1 mục)" className="mt-3">
          <textarea
            rows={4}
            value={achievementText}
            onChange={(e) => setAchievementText(e.target.value)}
            className="input"
            placeholder={"Giải thưởng Cống Hiến 2020\nQuán quân The Voice"}
          />
        </Field>

        <Field
          label="Mạng xã hội (mỗi dòng dạng &quot;Tên: URL&quot;)"
          className="mt-3"
        >
          <textarea
            rows={3}
            value={socialsText}
            onChange={(e) => setSocialsText(e.target.value)}
            className="input"
            placeholder={"Instagram: https://...\nYouTube: https://..."}
          />
        </Field>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            Xuất bản
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({ ...form, featured: e.target.checked })
              }
            />
            Nổi bật
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: inherit;
          outline: none;
        }
        .input:focus { border-color: oklch(0.7 0.19 295); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
