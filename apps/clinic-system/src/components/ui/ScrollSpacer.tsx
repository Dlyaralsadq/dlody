import { cn } from "@/lib/utils";
import {
  SCROLL_SPACER_BY_VARIANT,
  type ScrollSpacerVariant,
} from "@/lib/scrollUi";

export default function ScrollSpacer({
  variant = "page",
  className,
}: {
  variant?: ScrollSpacerVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "shrink-0 pointer-events-none",
        SCROLL_SPACER_BY_VARIANT[variant],
        className
      )}
    />
  );
}
