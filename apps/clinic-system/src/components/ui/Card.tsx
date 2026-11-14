import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className, variant = "default", padding = "md" }: CardProps) {
  const variants = {
    default: "card",
    glass: "card-glass",
    elevated: "card-premium",
  };
  return (
    <div className={cn(variants[variant], paddings[padding], className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, icon }: { children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <h3 className={cn("text-sm font-semibold text-app-1 flex items-center gap-2", className)}>
      {icon}
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-app-3 mt-1 leading-relaxed", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
