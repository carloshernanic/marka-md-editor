"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type MenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

/** Minimal dropdown with click-outside and Escape handling. */
export function Menu({ trigger, children, align = "left", className = "" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={className || "relative"}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={`animate-pop absolute top-full z-50 mt-1.5 min-w-44 rounded-2xl border border-border bg-surface p-1.5 shadow-pop ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon?: ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function MenuItem({ icon, label, hint, active, danger, disabled, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40 ${
        danger
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : active
            ? "bg-fg/[0.06] text-fg dark:bg-fg/[0.08]"
            : "text-fg hover:bg-fg/[0.05] dark:hover:bg-fg/[0.07]"
      }`}
    >
      {icon && <span className="grid w-4 place-items-center text-fg-muted">{icon}</span>}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-fg-faint">{hint}</span>}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
