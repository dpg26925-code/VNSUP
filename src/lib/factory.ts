// Shared constants + helpers for FactoryHub

export const SITE_URL = "https://vnsupplier.cloud";
export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;


export const PROVINCES: { slug: string; name: string }[] = [
  { slug: "binh-duong", name: "Bình Dương" },
  { slug: "dong-nai", name: "Đồng Nai" },
  { slug: "bac-ninh", name: "Bắc Ninh" },
  { slug: "tp-hcm", name: "TP.HCM" },
  { slug: "hai-phong", name: "Hải Phòng" },
  { slug: "tay-ninh", name: "Tây Ninh" },
];

export const INDUSTRIES: { slug: string; name: string; desc: string }[] = [
  { slug: "nhua", name: "Nhựa", desc: "Ép phun, thổi, đùn, bao bì mềm và cứng." },
  { slug: "cnc", name: "CNC", desc: "Gia công tiện phay CNC, khuôn mẫu, cơ khí chính xác." },
  { slug: "dien-tu", name: "Điện tử", desc: "SMT, PCBA, EMS trọn gói cho điện tử tiêu dùng và công nghiệp." },
  { slug: "kim-loai", name: "Kim loại", desc: "Cắt laser, chấn, hàn, kết cấu thép, gia công tấm." },
  { slug: "bao-bi", name: "Bao bì", desc: "Carton sóng, hộp giấy offset, in flexo, pallet." },
  { slug: "cao-su", name: "Cao su", desc: "Ép cao su kỹ thuật, silicone, khuôn cao su." },
  { slug: "det-may", name: "Dệt may", desc: "May mặc FOB/CMT, xuất khẩu đi Mỹ, EU, Nhật." },
];

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export function provinceBySlug(slug: string) {
  return PROVINCES.find((p) => p.slug === slug);
}
export function industryBySlug(slug: string) {
  return INDUSTRIES.find((i) => i.slug === slug);
}
export function provinceSlug(name: string) {
  return PROVINCES.find((p) => p.name === name)?.slug ?? "";
}
export function industrySlug(name: string) {
  return INDUSTRIES.find((i) => i.name === name)?.slug ?? "";
}

export function truncate(s: string | null | undefined, n = 155) {
  if (!s) return "";
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
}
