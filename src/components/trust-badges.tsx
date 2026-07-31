import { BadgeCheck, Building2, ExternalLink, Mail, MapPin, Receipt, ShieldCheck, Star } from "lucide-react";

export type VerificationLevel = "none" | "verified" | "premium" | "enterprise";

export const VERIFICATION_LEVELS: Record<
  Exclude<VerificationLevel, "none">,
  { label: string; requirement: string; className: string }
> = {
  verified: {
    label: "Verified",
    requirement: "Xác thực email + số điện thoại + mã số thuế",
    className: "bg-trust-verified text-trust-foreground",
  },
  premium: {
    label: "Premium Verified",
    requirement: "Verified + admin review + thăm nhà máy",
    className: "bg-trust-premium text-trust-foreground",
  },
  enterprise: {
    label: "Enterprise",
    requirement: "Premium + audit ISO + video tour",
    className: "bg-trust-enterprise text-trust-foreground",
  },
};

export function normalizeLevel(value: unknown): VerificationLevel {
  return value === "verified" || value === "premium" || value === "enterprise" ? value : "none";
}

/** Badge mức xác thực (Verified / Premium Verified / Enterprise). */
export function VerificationBadge({ level, className = "" }: { level: unknown; className?: string }) {
  const lv = normalizeLevel(level);
  if (lv === "none") return null;
  const cfg = VERIFICATION_LEVELS[lv];
  return (
    <span
      title={cfg.requirement}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${cfg.className} ${className}`}
    >
      {lv === "enterprise" ? (
        <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={2} />
      ) : lv === "premium" ? (
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
      ) : (
        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
      )}
      {cfg.label}
    </span>
  );
}

function Chip({
  icon,
  label,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  tone: "verified" | "premium";
}) {
  const cls =
    tone === "premium"
      ? "border-trust-premium/50 bg-trust-premium/10 text-foreground"
      : "border-trust-verified/50 bg-trust-verified/10 text-foreground";
  const inner = (
    <>
      {icon}
      {label}
      {href && <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2} />}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${cls}`}
      >
        {inner}
      </a>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {inner}
    </span>
  );
}

/** Dải trust badge: email, MST (link tra cứu Tổng cục Thuế), địa chỉ, Premium Partner. */
export function TrustBadges({
  emailVerified,
  taxVerified,
  addressVerified,
  taxCode,
  isFeatured,
  className = "",
}: {
  emailVerified?: boolean | null;
  taxVerified?: boolean | null;
  addressVerified?: boolean | null;
  taxCode?: string | null;
  isFeatured?: boolean | null;
  className?: string;
}) {
  const items: React.ReactNode[] = [];
  if (emailVerified)
    items.push(
      <Chip key="email" tone="verified" icon={<Mail className="h-3.5 w-3.5" strokeWidth={2} />} label="Đã xác thực email" />,
    );
  if (taxVerified)
    items.push(
      <Chip
        key="tax"
        tone="verified"
        icon={<Receipt className="h-3.5 w-3.5" strokeWidth={2} />}
        label="Đã xác thực MST"
        href={
          taxCode
            ? `https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp?mst=${encodeURIComponent(taxCode)}`
            : "https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp"
        }
      />,
    );
  if (addressVerified)
    items.push(
      <Chip
        key="address"
        tone="verified"
        icon={<MapPin className="h-3.5 w-3.5" strokeWidth={2} />}
        label="Đã xác thực địa chỉ"
      />,
    );
  if (isFeatured)
    items.push(
      <Chip
        key="premium"
        tone="premium"
        icon={<Building2 className="h-3.5 w-3.5" strokeWidth={2} />}
        label="Premium Partner"
      />,
    );
  if (items.length === 0) return null;
  return <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>{items}</div>;
}
