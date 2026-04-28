"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const MASTER_LINKS = [
  { href: "/master/customers", label: "Customers" },
  { href: "/master/customer-sites", label: "Customer Sites" },
  { href: "/master/assets", label: "Assets" },
  { href: "/master/technicians", label: "Technicians" },
  { href: "/master/service-types", label: "Service Types" },
  { href: "/master/priority-levels", label: "Priority Levels" },
  { href: "/master/skill-categories", label: "Skill Categories" },
  { href: "/master/asset-categories", label: "Asset Categories" },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [masterOpen, setMasterOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const isActive = (href: string) => pathname === href;
  const isMasterActive = pathname.startsWith("/master");
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "??";

  return (
    <nav className="relative z-40 border-b border-slate-800 bg-slate-950">
      <div className="flex h-14 items-center justify-between px-6">

        {/* Brand + Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 1L19 10L10 19L1 10L10 1Z" fill="#fbbf24" />
              <path d="M10 5.5L14.5 10L10 14.5L5.5 10L10 5.5Z" fill="#020617" />
            </svg>
            <span
              className="text-[22px] leading-none tracking-[0.08em] text-amber-400"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              FSM
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 lg:block">
              Field Service
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          {user && (
            <div className="hidden md:flex items-center">
              <Link
                href="/"
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive("/") ? "text-amber-400" : "text-slate-300 hover:text-white"
                }`}
              >
                Dashboard
                {isActive("/") && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-amber-400" />
                )}
              </Link>

              <Link
                href="/work-orders"
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  isActive("/work-orders") ? "text-amber-400" : "text-slate-300 hover:text-white"
                }`}
              >
                Work Orders
                {isActive("/work-orders") && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-amber-400" />
                )}
              </Link>

              <Link
                href="/technician/work-orders"
                className={`relative px-3 py-4 text-sm font-medium transition-colors ${
                  pathname.startsWith("/technician") ? "text-amber-400" : "text-slate-300 hover:text-white"
                }`}
              >
                My Assignment
                {pathname.startsWith("/technician") && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-amber-400" />
                )}
              </Link>

              {/* Master Data dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMasterOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setMasterOpen(false), 150)}
                  className={`relative flex items-center gap-1 px-3 py-4 text-sm font-medium transition-colors ${
                    isMasterActive ? "text-amber-400" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Master Data
                  <svg
                    className={`h-3.5 w-3.5 transition-transform duration-150 ${masterOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {isMasterActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-amber-400" />
                  )}
                </button>

                {masterOpen && (
                  <div className="absolute left-0 top-full z-50 mt-px w-52 border border-slate-800 bg-slate-900 py-1 shadow-2xl shadow-black/60">
                    {MASTER_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          pathname === link.href
                            ? "bg-amber-400/10 text-amber-400"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {pathname === link.href && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span className={pathname === link.href ? "" : "pl-4"}>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-amber-400 text-[10px] font-bold text-slate-950">
              {initials}
            </div>
            <span className="hidden text-sm text-slate-300 lg:block">{user.username}</span>
            {/* Sign out — desktop only */}
            <button
              onClick={handleLogout}
              className="hidden md:block border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Sign out
            </button>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex items-center justify-center p-1.5 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && user && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 pb-4">
          <div className="flex flex-col">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`border-l-2 px-6 py-3 text-sm font-medium transition-colors ${
                isActive("/")
                  ? "border-amber-400 bg-amber-400/5 text-amber-400"
                  : "border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/work-orders"
              onClick={() => setMobileOpen(false)}
              className={`border-l-2 px-6 py-3 text-sm font-medium transition-colors ${
                isActive("/work-orders")
                  ? "border-amber-400 bg-amber-400/5 text-amber-400"
                  : "border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Work Orders
            </Link>

            <Link
              href="/technician/work-orders"
              onClick={() => setMobileOpen(false)}
              className={`border-l-2 px-6 py-3 text-sm font-medium transition-colors ${
                pathname.startsWith("/technician")
                  ? "border-amber-400 bg-amber-400/5 text-amber-400"
                  : "border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              My Assignment
            </Link>

            {/* Master Data section */}
            <div className="mt-2 px-6 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Master Data
            </div>
            {MASTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`border-l-2 px-6 py-2.5 text-sm transition-colors ${
                  pathname === link.href
                    ? "border-amber-400 bg-amber-400/5 text-amber-400"
                    : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Sign out */}
            <div className="mt-4 px-6">
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full border border-slate-700 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
