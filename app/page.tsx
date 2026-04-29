"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type StatusItem = { status: string; count: number };
type OnTimeItem = { month: string; on_time: number; late: number };
type TechItem   = { technician_id: number; technician_name: string; hours: number };

// ─── Colour map for status donut ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  open:        "#fbbf24",
  in_progress: "#38bdf8",
  completed:   "#34d399",
  cancelled:   "#94a3b8",
};

// ─── Chart components (client-only, use recharts) ────────────────────────────
function StatusDonut({ data }: { data: StatusItem[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.status} fill={STATUS_COLOR[d.status] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [v, String(name).replace("_", " ")]}
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <span key={d.status} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[d.status] ?? "#64748b" }} />
            {d.status.replace("_", " ")} ({d.count})
          </span>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-500">Total: {total} work orders</p>
    </div>
  );
}

function OnTimeBar({ data }: { data: OnTimeItem[] }) {
  const fmt = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(+y, +mo - 1).toLocaleString("en", { month: "short", year: "2-digit" });
  };
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tickFormatter={fmt} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          formatter={(v, name) => [v, name === "on_time" ? "On-Time" : "Late"]}
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
        />
        <Bar dataKey="on_time" name="On-Time" fill="#34d399" radius={[2, 2, 0, 0]} />
        <Bar dataKey="late"    name="Late"    fill="#f87171" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TechBar({ data }: { data: TechItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} unit=" hr" />
        <YAxis type="category" dataKey="technician_name" width={90} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          formatter={(v) => [`${v} hr`, "Hours worked"]}
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
        />
        <Bar dataKey="hours" fill="#818cf8" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard charts section ─────────────────────────────────────────────────
function DashboardCharts() {
  const [statusData,  setStatusData]  = useState<StatusItem[] | null>(null);
  const [onTimeData,  setOnTimeData]  = useState<OnTimeItem[] | null>(null);
  const [techData,    setTechData]    = useState<TechItem[]   | null>(null);

  useEffect(() => {
    fetch("/api/proxy/api/fsm/dashboard/work-order-status")
      .then((r) => r.json()).then(setStatusData).catch(() => setStatusData([]));
    fetch("/api/proxy/api/fsm/dashboard/on-time-completion")
      .then((r) => r.json()).then(setOnTimeData).catch(() => setOnTimeData([]));
    fetch("/api/proxy/api/fsm/dashboard/technician-hours")
      .then((r) => r.json()).then(setTechData).catch(() => setTechData([]));
  }, []);

  const loading = statusData === null || onTimeData === null || techData === null;

  return (
    <div className="mt-10">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Analytics
      </div>
      {loading ? (
        <p className="text-xs text-slate-500">Loading charts…</p>
      ) : (
        <div className="grid gap-px sm:grid-cols-3">
          {/* Work Order Status */}
          <div className="bg-slate-900 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Work Order Status
            </p>
            {statusData.length === 0
              ? <p className="text-xs text-slate-500">No data</p>
              : <StatusDonut data={statusData} />}
          </div>

          {/* On-Time Completion */}
          <div className="bg-slate-900 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              On-Time vs Late (6 mo)
            </p>
            {onTimeData.length === 0
              ? <p className="text-xs text-slate-500">No data</p>
              : <OnTimeBar data={onTimeData} />}
          </div>

          {/* Technician Hours */}
          <div className="bg-slate-900 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Technician Hours (this month)
            </p>
            {techData.length === 0
              ? <p className="text-xs text-slate-500">No data</p>
              : <TechBar data={techData} />}
          </div>
        </div>
      )}
    </div>
  );
}

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

      <DashboardCharts />
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
