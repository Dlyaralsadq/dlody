import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}{props.required && <span className="text-rose-400 ms-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          dir="auto"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn("form-input", error && "!border-rose-500 focus:!ring-rose-500/20", className)}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-white/25 mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
