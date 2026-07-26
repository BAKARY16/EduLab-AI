import { type ReactNode, type ButtonHTMLAttributes } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const CARD = "rounded-3xl border border-night-900/8 bg-white shadow-[0_10px_35px_rgba(26,61,47,0.05)]";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(CARD, className)}>{children}</div>;
}

export function Badge({
  children,
  color = "sky",
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    sky: "bg-sky-edu/10 text-sky-edu ring-sky-edu/20",
    turq: "bg-turq/10 text-turq ring-turq/20",
    violet: "bg-violet-edu/10 text-violet-edu ring-violet-edu/20",
    leaf: "bg-leaf/10 text-leaf ring-leaf/20",
    amber: "bg-amber-edu/10 text-amber-edu ring-amber-edu/20",
    night: "bg-night-900/10 text-night-800 ring-night-900/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        map[color] || map.sky,
        className,
      )}
    >
      {children}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BtnProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-[#175c44] text-white shadow-md shadow-[#175c44]/20 hover:bg-[#236c51]",
    ghost: "text-night-800 hover:bg-night-900/5",
    outline:
      "border border-night-900/15 text-night-800 hover:bg-night-900/5 bg-white",
    soft: "bg-sky-edu/10 text-sky-edu hover:bg-sky-edu/20",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  color = "turq",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    turq: "bg-gradient-to-r from-turq to-turq-light",
    sky: "bg-gradient-to-r from-sky-edu to-sky-edu-light",
    leaf: "bg-gradient-to-r from-leaf to-leaf-light",
    amber: "bg-gradient-to-r from-amber-edu to-amber-edu-light",
    violet: "bg-gradient-to-r from-violet-edu to-violet-edu-light",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-night-900/10", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", map[color] || map.turq)}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 rounded-full border-2 border-sky-edu/30 border-t-sky-edu animate-spin-slow",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-night-900/15 bg-white/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-sky-edu/10 text-sky-edu">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-night-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-night-800/70">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turq">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1.5 text-2xl font-bold text-night-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-night-800/70">{subtitle}</p>}
    </div>
  );
}
