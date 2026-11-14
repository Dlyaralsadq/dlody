import { cn } from "@/lib/utils";
interface BadgeProps { children: React.ReactNode; variant?: "default"|"success"|"warning"|"danger"|"info"|"purple"|"yellow"|"cyan"; className?: string; dot?: boolean; }

const styles = {
  default: "bg-white/6 text-slate-400 border border-white/8",
  success: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/12 text-amber-400 border border-amber-500/20",
  danger:  "bg-rose-500/12 text-rose-400 border border-rose-500/20",
  info:    "bg-indigo-500/12 text-indigo-400 border border-indigo-500/20",
  purple:  "bg-violet-500/12 text-violet-400 border border-violet-500/20",
  yellow:  "bg-yellow-500/12 text-yellow-400 border border-yellow-500/20",
  cyan:    "bg-cyan-500/12 text-cyan-400 border border-cyan-500/20",
};
const dotColors = {
  default: "bg-slate-500", success: "bg-emerald-400", warning: "bg-amber-400",
  danger: "bg-rose-400", info: "bg-indigo-400", purple: "bg-violet-400",
  yellow: "bg-yellow-400", cyan: "bg-cyan-400",
};

export default function Badge({ children, variant="default", className, dot }: BadgeProps) {
  return (
    <span className={cn("badge", styles[variant], className)}>
      {dot && <span className={cn("status-dot", dotColors[variant])} />}
      {children}
    </span>
  );
}
export function getAppointmentStatusVariant(status: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    scheduled:"info", confirmed:"success", completed:"default", cancelled:"danger", noShow:"warning",
  };
  return map[status] ?? "default";
}
