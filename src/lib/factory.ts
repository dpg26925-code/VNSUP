// Shared constants + helpers for VNSupplier

export const SITE_URL = "https://vnsupplier.cloud";
export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;


// Danh sách 34 đơn vị hành chính cấp tỉnh sau sáp nhập 01/07/2025
// (6 thành phố trực thuộc TW + 28 tỉnh) theo Nghị quyết của Quốc hội.
export const PROVINCES: { slug: string; name: string }[] = [
  // Thành phố trực thuộc Trung ương
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "tp-hcm", name: "TP.HCM" },
  { slug: "hai-phong", name: "Hải Phòng" },
  { slug: "da-nang", name: "Đà Nẵng" },
  { slug: "can-tho", name: "Cần Thơ" },
  { slug: "hue", name: "Huế" },
  // Tỉnh
  { slug: "lai-chau", name: "Lai Châu" },
  { slug: "dien-bien", name: "Điện Biên" },
  { slug: "son-la", name: "Sơn La" },
  { slug: "lang-son", name: "Lạng Sơn" },
  { slug: "quang-ninh", name: "Quảng Ninh" },
  { slug: "thanh-hoa", name: "Thanh Hóa" },
  { slug: "nghe-an", name: "Nghệ An" },
  { slug: "ha-tinh", name: "Hà Tĩnh" },
  { slug: "cao-bang", name: "Cao Bằng" },
  { slug: "tuyen-quang", name: "Tuyên Quang" },
  { slug: "lao-cai", name: "Lào Cai" },
  { slug: "thai-nguyen", name: "Thái Nguyên" },
  { slug: "phu-tho", name: "Phú Thọ" },
  { slug: "bac-ninh", name: "Bắc Ninh" },
  { slug: "hung-yen", name: "Hưng Yên" },
  { slug: "ninh-binh", name: "Ninh Bình" },
  { slug: "quang-tri", name: "Quảng Trị" },
  { slug: "quang-ngai", name: "Quảng Ngãi" },
  { slug: "gia-lai", name: "Gia Lai" },
  { slug: "khanh-hoa", name: "Khánh Hòa" },
  { slug: "lam-dong", name: "Lâm Đồng" },
  { slug: "dak-lak", name: "Đắk Lắk" },
  { slug: "dong-nai", name: "Đồng Nai" },
  { slug: "tay-ninh", name: "Tây Ninh" },
  { slug: "vinh-long", name: "Vĩnh Long" },
  { slug: "dong-thap", name: "Đồng Tháp" },
  { slug: "an-giang", name: "An Giang" },
  { slug: "ca-mau", name: "Cà Mau" },
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
