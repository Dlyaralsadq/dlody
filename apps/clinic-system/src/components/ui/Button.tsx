"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"danger"|"ghost"|"outline"|"success"|"cyan";
  size?: "xs"|"sm"|"md"|"lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant="primary", size="md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060912] disabled:opacity-45 disabled:cursor-not-allowed select-none whitespace-nowrap";
    const v = {
      primary:   "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-lg shadow-indigo-950/60",
      secondary: "bg-white/6 text-slate-300 hover:bg-white/10 border border-white/8 hover:border-white/15 focus-visible:ring-slate-600",
      danger:    "bg-rose-600/90 text-white hover:bg-rose-500 focus-visible:ring-rose-500 shadow-lg shadow-rose-950/50",
      success:   "bg-emerald-600/90 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500 shadow-lg shadow-emerald-950/50",
      ghost:     "text-slate-400 hover:text-white hover:bg-white/6 focus-visible:ring-slate-600",
      outline:   "border border-white/10 text-slate-300 hover:bg-white/6 hover:border-white/20 focus-visible:ring-slate-600",
      cyan:      "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/25 focus-visible:ring-cyan-500",
    };
    const s = { xs:"px-2.5 py-1.5 text-xs", sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-5 py-2.5 text-sm" };
    return (
      <button ref={ref} className={cn(base, v[variant], s[size], className)} disabled={disabled||loading} {...props}>
        {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
