import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ZoneDetail, buildZoneHead } from "@/components/zone-detail";
import type { ZoneRow } from "@/lib/zones";

async function loadZone(slug: string): Promise<ZoneRow> {
  const { data, error } = await supabase
    .from("industrial_zones")
    .select("*")
    .eq("slug", slug)
    .eq("kind", "ccn")
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as ZoneRow;
}

export const Route = createFileRoute("/cum-cong-nghiep/$slug")({
  loader: ({ params }) => loadZone(params.slug),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy CCN" }, { name: "robots", content: "noindex" }] };
    return buildZoneHead(loaderData);
  },
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Lỗi tải CCN: {String(error?.message ?? error)}</div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy Cụm Công Nghiệp</h1>
      <p className="mt-2 text-sm text-muted-foreground">CCN này chưa có trên hệ thống hoặc đã bị gỡ.</p>
      <Link to="/cum-cong-nghiep" className="mt-4 inline-block text-sm text-brand hover:underline">← Về danh sách CCN</Link>
    </div>
  ),
  component: CCNDetail,
});

function CCNDetail() {
  const zone = Route.useLoaderData();
  return <ZoneDetail zone={zone} />;
}
