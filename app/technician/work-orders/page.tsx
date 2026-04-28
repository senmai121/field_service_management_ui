"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";
import { MyWorkOrder } from "@/lib/types";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-4 mb-4">
      <div className="mb-3 h-4 w-1/3 rounded bg-slate-800" />
      <div className="mb-2 h-5 w-2/3 rounded bg-slate-800" />
      <div className="mb-4 h-3 w-1/4 rounded bg-slate-800" />
      <div className="h-8 w-full rounded bg-slate-800" />
    </div>
  );
}

// Return "YYYY-MM-DDTHH:mm" from a date string, or "" if null
function toDatetimeLocal(dt?: string | null) {
  if (!dt) return "";
  return new Date(dt).toISOString().slice(0, 16);
}

function TechnicianWorkOrdersContent() {
  const [orders, setOrders] = useState<MyWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notLinked, setNotLinked] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Per-WO actual time overrides (keyed by WO id)
  const [actualStart, setActualStart] = useState<Record<string, string>>({});
  const [actualEnd, setActualEnd] = useState<Record<string, string>>({});

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotLinked(false);
    try {
      const res = await apiFetch("fsm/my-work-orders");
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) { setNotLinked(true); } else { setError(json.error ?? "Failed to load"); }
        return;
      }
      setOrders(json.data ?? []);
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Get effective actual_start for a WO (override > actual > scheduled > "")
  const getStart = (wo: MyWorkOrder) =>
    actualStart[wo.id] ?? toDatetimeLocal(wo.actual_start ?? wo.scheduled_start);

  // Get effective actual_end for a WO (override > actual > scheduled > "")
  const getEnd = (wo: MyWorkOrder) =>
    actualEnd[wo.id] ?? toDatetimeLocal(wo.actual_end ?? wo.scheduled_end);

  const handleStatusUpdate = async (wo: MyWorkOrder, status: string) => {
    const start = getStart(wo);
    const end = getEnd(wo);

    // Validate: start must not be after end (when both are set)
    if (start && end && new Date(start) > new Date(end)) {
      alert("เวลาเริ่มต้องไม่เกินเวลาสิ้นสุด");
      return;
    }

    // Decide which actual times to send per transition
    const payload: Record<string, string | undefined> = { status };
    if (status === "in_progress") payload.actual_start = start || undefined;
    if (status === "completed")   payload.actual_end   = end   || undefined;

    setUpdating(wo.id);
    try {
      const res = await apiFetch(`fsm/work-orders/${wo.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert("อัปเดตสถานะไม่สำเร็จ"); return; }
      // Clear overrides for this WO after success
      setActualStart((s) => { const n = { ...s }; delete n[wo.id]; return n; });
      setActualEnd((s) => { const n = { ...s }; delete n[wo.id]; return n; });
      await loadOrders();
    } catch {
      alert("Network error");
    } finally {
      setUpdating(null);
    }
  };

  const fmt = (dt?: string) =>
    dt ? new Date(dt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : null;

  const isOverdue = (dt?: string) => !!dt && new Date(dt) < new Date();

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="h-7 w-32 rounded bg-slate-800 animate-pulse mb-2" />
          <div className="h-4 w-48 rounded bg-slate-800 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">My Assignment</h1>
          <p className="mt-1 text-sm text-slate-500">Work orders assigned to you</p>
        </div>

        {notLinked && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mb-3 text-4xl">⚙️</div>
            <p className="font-medium text-slate-300">No Technician Profiles</p>
            <p className="mt-1 text-sm text-slate-500">Please contact Administrator</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!notLinked && !error && orders.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-16 text-center">
            <div className="mb-4 text-5xl">🔧</div>
            <p className="font-medium text-slate-300">ไม่มีงานที่ได้รับมอบหมาย</p>
            <p className="mt-1 text-sm text-slate-500">ยังไม่มีงานที่ถูก assign ให้คุณในขณะนี้</p>
          </div>
        )}

        {orders.map((wo) => {
          const startVal = getStart(wo);
          const endVal   = getEnd(wo);
          const startAfterEnd = !!(startVal && endVal && new Date(startVal) > new Date(endVal));
          const isActionable = wo.status === "assigned" || wo.status === "in_progress" || wo.status === "on_hold";

          return (
            <div key={wo.id} className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
              {/* Header */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs text-slate-600">{wo.order_no ?? "—"}</span>
                  <h2 className="mt-0.5 text-base font-semibold text-white leading-snug">{wo.title}</h2>
                </div>
                {wo.priority_name && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: wo.priority_color ?? "#6B7280" }} />
                    {wo.priority_name}
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="mb-3"><StatusBadge status={wo.status} /></div>

              {/* Location */}
              <div className="mb-2 text-sm">
                <span className="font-medium text-slate-200">{wo.customer_name}</span>
                <span className="mx-1.5 text-slate-600">›</span>
                <span className="text-slate-400">{wo.site_name}</span>
                {wo.site_address && <div className="mt-0.5 text-xs text-slate-600">{wo.site_address}</div>}
              </div>

              {/* Asset */}
              {wo.asset_name && (
                <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <span className="text-xs font-medium text-amber-400">🔧 Asset: </span>
                  <span className="text-xs text-amber-300">{wo.asset_name}</span>
                  {wo.asset_serial && <span className="ml-1.5 text-xs text-slate-500">({wo.asset_serial})</span>}
                </div>
              )}

              {/* Schedule */}
              {wo.scheduled_start && (
                <div className="mb-2 text-xs text-slate-500">
                  📅 {fmt(wo.scheduled_start)}{wo.scheduled_end && <> — {fmt(wo.scheduled_end)}</>}
                </div>
              )}

              {/* SLA */}
              {wo.sla_due_at && (
                <div className={`mb-3 text-xs font-medium ${isOverdue(wo.sla_due_at) ? "text-red-400" : "text-yellow-500"}`}>
                  ⏰ SLA: {fmt(wo.sla_due_at)}{isOverdue(wo.sla_due_at) && " — เกินกำหนด"}
                </div>
              )}

              {/* Description */}
              {wo.description && <p className="mb-3 text-xs text-slate-500 leading-relaxed">{wo.description}</p>}

              {/* Actual times + action buttons */}
              {isActionable && (
                <div className="border-t border-slate-800 pt-3 space-y-3">

                  {/* Actual time inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        เวลาเริ่มจริง
                      </label>
                      <input
                        type="datetime-local"
                        value={startVal}
                        onChange={(e) => setActualStart((s) => ({ ...s, [wo.id]: e.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        เวลาสิ้นสุดจริง
                      </label>
                      <input
                        type="datetime-local"
                        value={endVal}
                        onChange={(e) => setActualEnd((s) => ({ ...s, [wo.id]: e.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {startAfterEnd && (
                    <p className="text-xs text-red-400">⚠ เวลาเริ่มต้องไม่เกินเวลาสิ้นสุด</p>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {wo.status === "assigned" && (
                      <button
                        disabled={!!updating || startAfterEnd}
                        onClick={() => handleStatusUpdate(wo, "in_progress")}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {updating === wo.id ? "กำลังอัปเดต…" : "▶ เริ่มงาน"}
                      </button>
                    )}
                    {wo.status === "in_progress" && (
                      <>
                        <button
                          disabled={!!updating}
                          onClick={() => handleStatusUpdate(wo, "on_hold")}
                          className="flex-1 rounded-lg bg-yellow-600 py-2 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50"
                        >
                          {updating === wo.id ? "…" : "⏸ พักงาน"}
                        </button>
                        <button
                          disabled={!!updating || startAfterEnd}
                          onClick={() => handleStatusUpdate(wo, "completed")}
                          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {updating === wo.id ? "…" : "✅ เสร็จแล้ว"}
                        </button>
                      </>
                    )}
                    {wo.status === "on_hold" && (
                      <button
                        disabled={!!updating || startAfterEnd}
                        onClick={() => handleStatusUpdate(wo, "in_progress")}
                        className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
                      >
                        {updating === wo.id ? "กำลังอัปเดต…" : "▶ กลับมาทำงาน"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TechnicianWorkOrdersPage() {
  return <AuthGuard><TechnicianWorkOrdersContent /></AuthGuard>;
}
