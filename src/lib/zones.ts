// Helpers cho Khu Công Nghiệp (KCN) & Cụm Công Nghiệp (CCN)
import { abs } from "@/lib/factory";

export type ZoneKind = "kcn" | "ccn";

export const ZONE_META: Record<ZoneKind | "companies" | "zones", {
  kind: string;
  label: string;
  fullLabel: string;
  path: string;
  listTitle: string;
  listDescription: string;
}> = {
  kcn: {
    kind: "kcn",
    label: "KCN",
    fullLabel: "Khu Công Nghiệp",
    path: "/khu-cong-nghiep",
    listTitle: "Danh sách Khu Công Nghiệp (KCN) tại Việt Nam | VNSupplier",
    listDescription:
      "Danh sách các Khu Công Nghiệp (KCN) uy tín tại Việt Nam: diện tích, tỷ lệ lấp đầy, chủ đầu tư, ngành ưu tiên và liên hệ.",
  },
  ccn: {
    kind: "ccn",
    label: "CCN",
    fullLabel: "Cụm Công Nghiệp",
    path: "/cum-cong-nghiep",
    listTitle: "Danh sách Cụm Công Nghiệp (CCN) tại Việt Nam | VNSupplier",
    listDescription:
      "Danh sách các Cụm Công Nghiệp (CCN) trên khắp Việt Nam: diện tích, chủ đầu tư, ngành ưu tiên và giá thuê.",
  },
  companies: {
    kind: "companies",
    label: "Doanh nghiệp",
    fullLabel: "Danh sách Doanh nghiệp",
    path: "/companies",
    listTitle: "Danh mục Doanh nghiệp sản xuất Việt Nam | VNSupplier",
    listDescription: "Khám phá hàng nghìn nhà máy sản xuất tại Việt Nam theo ngành và khu vực.",
  },
  zones: {
    kind: "zones",
    label: "KCN/CCN",
    fullLabel: "Khu & Cụm Công Nghiệp",
    path: "/kcn-ccn",
    listTitle: "Khu công nghiệp & Cụm công nghiệp Việt Nam | VNSupplier",
    listDescription: "Tra cứu thông tin chi tiết các khu công nghiệp và cụm công nghiệp trên toàn quốc.",
  },
};

export function zoneAbs(kind: ZoneKind, slug?: string) {
  const base = ZONE_META[kind].path;
  return abs(slug ? `${base}/${slug}` : base);
}

export type ZoneFAQ = { q: string; a: string };
export type ZoneRow = {
  id: string;
  kind: ZoneKind;
  name: string;
  slug: string;
  province: string | null;
  district: string | null;
  address: string | null;
  developer: string | null;
  established_year: number | null;
  area_ha: number | null;
  occupancy_percent: number | null;
  land_price_usd_m2_year: number | null;
  industries: string[] | null;
  logo_url: string | null;
  banner_url: string | null;
  gallery_url: string[] | null;
  description: string | null;
  ai_summary: string | null;
  highlights: string[] | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  faqs: unknown;
  status: string;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string | null;
};

export function parseFaqs(v: unknown): ZoneFAQ[] {
  if (!Array.isArray(v)) return [];
  return (v as { q?: string; a?: string }[])
    .filter((f) => f && typeof f.q === "string" && typeof f.a === "string")
    .map((f) => ({ q: f.q as string, a: f.a as string }));
}
