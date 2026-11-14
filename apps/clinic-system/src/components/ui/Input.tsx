import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}{props.required && <span className="text-rose-400 ms-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <span className="form-input-icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            dir="auto"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "form-input",
              icon && "form-input-with-icon",
              error && "!border-rose-500 focus:!ring-rose-500/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="form-hint text-rose-400">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
