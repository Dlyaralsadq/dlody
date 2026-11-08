import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface AlertProps {
  variant?: "error" | "success" | "info" | "warning";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: {
    cls: "alert-error",
    Icon: AlertCircle,
  },
  success: {
    cls: "alert-success",
    Icon: CheckCircle2,
  },
  info: {
    cls: "alert-info",
    Icon: Info,
  },
  warning: {
    cls: "alert-warning",
    Icon: AlertCircle,
  },
};

export default function Alert({ variant = "info", children, className }: AlertProps) {
  const { cls, Icon } = variants[variant];
  return (
    <div className={cn("alert", cls, className)} role="alert">
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
