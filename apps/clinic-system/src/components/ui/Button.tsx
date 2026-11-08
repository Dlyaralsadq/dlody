"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success" | "cyan" | "patient";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-[0.01em] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed select-none whitespace-nowrap";

    const v: Record<string, string> = {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-sm shadow-indigo-950/30 ring-1 ring-indigo-500/40",
      patient:
        "bg-cyan-600 text-white hover:bg-cyan-500 focus-visible:ring-cyan-500 shadow-sm shadow-cyan-950/30 ring-1 ring-cyan-500/40",
      secondary:
        "bg-app-hover text-app-2 hover:text-app-1 ring-1 ring-[var(--border)] hover:ring-[var(--border-hover)] focus-visible:ring-slate-500",
      danger:
        "text-rose-400 ring-1 ring-rose-500/25 hover:ring-rose-500/40 focus-visible:ring-rose-500",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-950/30",
      ghost:
        "text-app-2 hover:text-app-1 hover:bg-app-hover focus-visible:ring-slate-500",
      outline:
        "text-app-2 hover:text-app-1 hover:bg-app-hover ring-1 ring-[var(--border)] hover:ring-[var(--border-hover)] focus-visible:ring-slate-500",
      cyan:
        "text-cyan-400 ring-1 ring-cyan-500/25 hover:bg-cyan-500/10 hover:ring-cyan-500/40 focus-visible:ring-cyan-500",
    };

    const s: Record<string, string> = {
      xs: "px-2.5 py-1.5 text-xs rounded-lg",
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-5 py-3 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(base, v[variant] ?? v.primary, s[size], fullWidth && "w-full", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
