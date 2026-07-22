import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Layout primitives — token-based, no hardcoded colors.
 * Compose these instead of duplicating flex/grid classes.
 */

type Gap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";
const gapMap: Record<Gap, string> = {
  "0": "gap-0", "1": "gap-1", "2": "gap-2", "3": "gap-3", "4": "gap-4",
  "5": "gap-5", "6": "gap-6", "8": "gap-8", "10": "gap-10", "12": "gap-12",
};

type Align = "start" | "center" | "end" | "stretch" | "baseline";
const alignMap: Record<Align, string> = {
  start: "items-start", center: "items-center", end: "items-end",
  stretch: "items-stretch", baseline: "items-baseline",
};

type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
const justifyMap: Record<Justify, string> = {
  start: "justify-start", center: "justify-center", end: "justify-end",
  between: "justify-between", around: "justify-around", evenly: "justify-evenly",
};

type StackProps<T extends ElementType> = {
  as?: T;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function VStack<T extends ElementType = "div">({
  as, gap = "4", align, justify, className, children, ...rest
}: StackProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "flex flex-col min-w-0",
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function HStack<T extends ElementType = "div">({
  as, gap = "3", align = "center", justify, wrap, className, children, ...rest
}: StackProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "flex min-w-0",
        gapMap[gap],
        alignMap[align],
        justify && justifyMap[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

type ClusterProps = {
  gap?: Gap;
  className?: string;
  children?: ReactNode;
};
/** Wrapping row of chips/tags — auto-wraps, tight vertical rhythm. */
export function Cluster({ gap = "2", className, children }: ClusterProps) {
  return <div className={cn("flex flex-wrap items-center", gapMap[gap], className)}>{children}</div>;
}

type ContainerProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children?: ReactNode;
};
const containerSize: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-7xl", xl: "max-w-[90rem]",
};
export function Container({ size = "lg", className, children }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6", containerSize[size], className)}>{children}</div>;
}

type SectionProps = {
  as?: ElementType;
  tone?: "default" | "muted" | "card";
  spacing?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
  id?: string;
};
const toneMap = { default: "", muted: "bg-muted/30", card: "bg-card" } as const;
const spacingMap = { sm: "py-8", md: "py-12 sm:py-16", lg: "py-16 sm:py-24" } as const;
export function Section({ as, tone = "default", spacing = "md", className, children, id }: SectionProps) {
  const Comp = (as ?? "section") as ElementType;
  return (
    <Comp id={id} className={cn(toneMap[tone], spacingMap[spacing], className)}>
      {children}
    </Comp>
  );
}

/** Responsive card grid — mobile 1col, sm 2, lg 3, xl optional 4. */
export function CardGrid({
  cols = 3,
  gap = "3",
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  gap?: Gap;
  className?: string;
  children?: ReactNode;
}) {
  const colsMap = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  } as const;
  return (
    <div className={cn("grid grid-cols-1", colsMap[cols], gapMap[gap], className)}>
      {children}
    </div>
  );
}

/** Semantic section header: eyebrow + title + optional description. */
export function SectionHeader({
  eyebrow, title, description, actions, align = "start",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
      )}
    >
      <div className={cn("min-w-0", align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </div>
        )}
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
