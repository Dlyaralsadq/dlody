"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Button from "./Button";
import ScrollSpacer from "./ScrollSpacer";
import { SCROLL_CONTAINER } from "@/lib/scrollUi";

interface ModalProps {
  isOpen: boolean; onClose: () => void; title?: string;
  children: React.ReactNode; size?: "sm"|"md"|"lg"|"xl"; footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size="md", footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key==="Escape" && onClose();
    if (isOpen) { document.addEventListener("keydown", fn); document.body.style.overflow="hidden"; }
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow=""; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const sizes = { sm:"max-w-md", md:"max-w-lg", lg:"max-w-2xl", xl:"max-w-4xl" };

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target===ref.current && onClose()}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Modal container — flex column with max height */}
      <div className={cn("relative w-full animate-fade-up flex flex-col", sizes[size])}>
        <div className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", maxHeight: "90vh" }}>

          {/* Header — fixed */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
              <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Body — scrollable */}
          <div className={cn("flex-1 px-6 py-5", SCROLL_CONTAINER)}>
            {children}
            <ScrollSpacer variant="modal" />
          </div>

          {/* Footer — fixed at bottom */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
