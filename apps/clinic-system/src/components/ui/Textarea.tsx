import { cn } from "@/lib/utils";
import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const tid = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={tid} className="form-label">
            {label}{props.required && <span className="text-rose-400 ms-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={tid}
          rows={3}
          dir="auto"
          autoCorrect="off"
          spellCheck={false}
          className={cn("form-input resize-none", error && "!border-rose-500", className)}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
export default Textarea;
