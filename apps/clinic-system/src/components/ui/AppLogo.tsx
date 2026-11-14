import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  accent?: "staff" | "patient";
  className?: string;
}

const sizes = { sm: "h-9 w-9 rounded-xl", md: "h-14 w-14 rounded-2xl", lg: "h-20 w-20 rounded-3xl" };
const iconSizes = { sm: 16, md: 26, lg: 36 };

export default function AppLogo({ size = "md", accent = "staff", className }: AppLogoProps) {
  const grad = accent === "patient"
    ? "from-cyan-600 to-teal-600 shadow-cyan-950/40"
    : "from-indigo-600 to-violet-600 shadow-indigo-950/50";

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br shadow-lg",
        sizes[size],
        grad,
        className
      )}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d="M12 8v8M9 11h6"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
