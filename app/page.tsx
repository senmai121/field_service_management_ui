"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";

const DASHBOARD_CARDS = [
  {
    title: "Work Orders",
    description: "Create, assign, and track all field service work orders in real time.",
    href: "/work-orders",
    accent: "border-l-amber-400",
    iconColor: "text-amber-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: "Customers",
    description: "Manage customer accounts, contacts, and service contracts.",
    href: "/master/customers",
    accent: "border-l-sky-400",
    iconColor: "text-sky-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Technicians",
    description: "View, schedule, and assign qualified field technicians.",
    href: "/master/technicians",
    accent: "border-l-emerald-400",
    iconColor: "text-emerald-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Asset Categories",
    description: "Classify and maintain equipment and service asset types.",
    href: "/master/asset-categories",
    accent: "border-l-violet-400",
    iconColor: "text-violet-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

const MASTER_LINKS = [
  { label: "Customer Sites", href: "/master/customer-sites" },
  { label: "Service Types", href: "/master/service-types" },
  { label: "Priority Levels", href: "/master/priority-levels" },
  { label: "Skill Categories", href: "/master/skill-categories" },
];

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
          Operations Center
        </p>
        <h1
          className="text-[52px] leading-none text-slate-100"
          style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.03em" }}
        >
          Welcome back,{" "}
          <span className="text-amber-400">{user?.username}</span>
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Main cards */}
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Quick Access
      </div>
      <div className="mb-10 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group flex flex-col border-l-2 bg-slate-900 p-6 transition-all hover:bg-slate-800/80 ${card.accent}`}
          >
            <div className={`mb-4 ${card.iconColor}`}>{card.icon}</div>
            <h2 className="mb-1.5 text-sm font-semibold text-slate-200 group-hover:text-white">
              {card.title}
            </h2>
            <p className="text-xs leading-relaxed text-slate-400">{card.description}</p>
            <span className={`mt-4 text-xs font-medium ${card.iconColor}`}>
              Open →
            </span>
          </Link>
        ))}
      </div>

      {/* Master data quick links */}
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Master Data
      </div>
      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {MASTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between bg-slate-900 px-4 py-3.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {link.label}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
