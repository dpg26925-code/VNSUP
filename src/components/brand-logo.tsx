import { Link } from "@tanstack/react-router";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
  to?: string;
}

export function BrandLogo({ size = "md", className = "", to = "/" }: BrandLogoProps) {
  const heightClasses = {
    sm: "h-7 sm:h-8",
    md: "h-9 sm:h-10",
    lg: "h-11 sm:h-12",
  };

  const imgHeight = heightClasses[size];

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Light Mode Logo (Visible when NOT in dark mode) */}
      <img
        src="/assets/vnsupplier-logo-light.svg"
        alt="VNSupplier — Vietnam Manufacturing Network"
        width={180}
        height={44}
        className={`brand-logo-light ${imgHeight} w-auto object-contain select-none`}
        loading="eager"
      />

      {/* Dark Mode Logo (Visible ONLY in dark mode) */}
      <img
        src="/assets/vnsupplier-logo-dark.svg"
        alt="VNSupplier — Vietnam Manufacturing Network"
        width={180}
        height={44}
        className={`brand-logo-dark ${imgHeight} w-auto object-contain select-none`}
        loading="eager"
      />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="flex shrink-0 items-center transition hover:opacity-90" aria-label="VNSupplier Home">
        {content}
      </Link>
    );
  }

  return content;
}

export function BrandIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  return (
    <img
      src="/assets/vnsupplier-icon.svg"
      alt="VNSupplier Icon"
      width={48}
      height={48}
      className={`shrink-0 ${sizeClasses[size]} object-contain select-none ${className}`}
      loading="eager"
    />
  );
}
