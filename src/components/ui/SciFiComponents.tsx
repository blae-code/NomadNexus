import type { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const clipShape = "polygon(0 0, 100% 0, 100% 75%, 95% 100%, 0 100%)";

type NexusButtonVariant = "primary" | "ghost" | "alert";

interface NexusButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: NexusButtonVariant;
  icon?: ReactNode;
}

const buttonVariantClasses: Record<NexusButtonVariant, string> = {
  primary:
    "bg-burnt-orange text-tech-white border border-burnt-orange/60 hover:border-burnt-orange hover:shadow-[0_0_12px_rgba(204,85,0,0.55)]",
  ghost:
    "bg-transparent text-tech-white border border-slate-700 hover:border-burnt-orange hover:text-burnt-orange",
  alert:
    "bg-transparent text-foreground border border-red-600 hover:border-red-400 hover:shadow-[0_0_16px_rgba(239,68,68,0.45)] text-red-400",
};

export const NexusButton = ({
  variant = "primary",
  icon,
  className,
  children,
  ...props
}: NexusButtonProps) => {
  const merged = twMerge(
    clsx(
      "relative inline-flex items-center gap-3 px-4 py-2 uppercase tracking-[0.14em] transition duration-200 font-semibold",
      "bg-gunmetal text-tech-white no-underline select-none active:translate-y-[1px] focus-visible:outline-none",
      buttonVariantClasses[variant],
      className
    )
  );

  return (
    <button
      {...props}
      style={{ clipPath: clipShape }}
      className={merged}
      data-variant={variant}
    >
      {icon && <span className="grid place-items-center text-base text-current">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

interface NexusCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  meta?: string;
}

export const NexusCard = ({ title, meta, className, children, ...props }: NexusCardProps) => {
  const merged = twMerge(
    clsx(
      "border border-slate-700 border-l-4 border-l-burnt-orange bg-gunmetal/80 text-tech-white",
      "p-4 shadow-[0_0_20px_rgba(15,23,42,0.35)]",
      className
    )
  );

  return (
    <div {...props} className={merged}>
      {(title || meta) && (
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
          <span>{title}</span>
          {meta && <span className="text-burnt-orange">{meta}</span>}
        </div>
      )}
      <div className="text-sm text-slate-100">{children}</div>
    </div>
  );
};

type NexusBadgeStatus = "online" | "busy" | "offline";

interface NexusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status?: NexusBadgeStatus;
  label: string;
}

const statusColors: Record<NexusBadgeStatus, string> = {
  online: "bg-indicator-green shadow-[0_0_12px_rgba(0,255,65,0.65)]",
  busy: "bg-indicator-red shadow-[0_0_12px_rgba(239,68,68,0.65)]",
  offline: "bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.45)]",
};

export const NexusBadge = ({ status = "online", label, className, ...props }: NexusBadgeProps) => {
  const merged = twMerge(
    clsx(
      "inline-flex items-center gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-200 border border-slate-600 bg-gunmetal",
      className
    )
  );

  return (
    <div {...props} className={merged}>
      <span
        className="relative h-3 w-3 shrink-0 rounded-full"
      >
        <span
          className={twMerge(
            clsx("absolute inset-0 animate-ping opacity-50", statusColors[status])
          )}
        />
        <span className={twMerge(clsx("absolute inset-0", statusColors[status]))} />
      </span>
      <span className="text-current">{label}</span>
    </div>
  );
};

interface ScanlineProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: number;
}

export const Scanline = ({ intensity = 0.08, className, style, ...props }: ScanlineProps) => {
  const merged = twMerge(
    clsx("pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60", className)
  );

  return (
    <div
      {...props}
      className={merged}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 4px)",
        filter: `brightness(1) contrast(1.${Math.floor(intensity * 100)})`,
        ...style,
      }}
    />
  );
};

export default {
  NexusButton,
  NexusCard,
  NexusBadge,
  Scanline,
};
