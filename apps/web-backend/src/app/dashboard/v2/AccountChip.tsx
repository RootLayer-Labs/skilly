"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import type { DashboardRole } from "@/lib/dashboardAuth";

/*
 * Account chip for the topbar (the missing user identity affordance).
 * Shows an initials avatar + email + role, with a keyboard-reachable dropdown
 * to reach Settings / Sign out. Per design-system + taste-skill a11y rules:
 * real focus states, Escape-to-close, click-outside-to-close, and the dropdown
 * is a leaf client component so no provider/state leaks into the RSC tree.
 */
function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return "·";
  const handle = email.split("@")[0] ?? email;
  const parts = handle.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return handle.slice(0, 2).toUpperCase();
}

export function AccountChip({
  email,
  role,
}: {
  email: string | null;
  role: DashboardRole;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const roleLabel = role === "super_admin" ? "Super admin" : "Tenant admin";

  // Click-outside + Escape-to-close (keyboard-reachable per a11y).
  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-[38px] items-center gap-2 rounded-[10px] border border-line bg-surface py-1 pl-1 pr-2 text-sm text-fg outline-none transition hover:bg-surface-strong focus-visible:ring-[3px] focus-visible:ring-accent-line"
      >
        {/* Initials avatar — amber-tinted circle. */}
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent-text">
          {initialsFromEmail(email)}
        </span>
        <span className="hidden max-w-[160px] truncate sm:block">{email ?? "Account"}</span>
        <ChevronDown
          size={14}
          className={`text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-60 overflow-hidden rounded-[14px] border border-line bg-canvas shadow-overlay"
        >
          {/* Identity header */}
          <div className="border-b border-line-soft px-3.5 py-3">
            <div className="truncate text-sm font-bold text-fg">{email ?? "Signed in"}</div>
            <div className="mt-0.5 text-xs text-fg-muted">{roleLabel}</div>
          </div>
          {/* Actions */}
          <div className="p-1.5">
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-sm text-fg-muted outline-none transition hover:bg-surface-strong focus-visible:ring-[3px] focus-visible:ring-accent-line"
            >
              <SettingsIcon size={16} className="text-fg-subtle" strokeWidth={1.75} />
              Settings
            </Link>
            <form action="/api/dashboard/logout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-sm text-danger outline-none transition hover:bg-danger-soft focus-visible:ring-[3px] focus-visible:ring-accent-line"
              >
                <LogOut size={16} strokeWidth={1.75} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
