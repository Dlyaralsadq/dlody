import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}{props.required && <span className="text-red-400 ms-1">*</span>}
          </label>
        )}
        <select ref={ref} id={selectId}
          className={cn("form-input", error && "!border-red-500", className)} {...props}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
export default Select;
