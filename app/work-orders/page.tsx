"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCrud } from "@/lib/useCrud";
import { apiFetch } from "@/lib/api";
import { WorkOrder, Asset, Customer, CustomerSite, ServiceType, PriorityLevel, Technician } from "@/lib/types";

const STATUSES = ["draft", "assigned", "in_progress", "on_hold", "completed", "closed", "cancelled"];

const EMPTY_FORM = {
  title: "",
  customer_id: "",
  customer_site_id: "",
  asset_id: "",
  service_type_id: "",
  priority_level_id: "",
  status: "draft",
  description: "",
  scheduled_start: "",
  scheduled_end: "",
  repair_cost: "",
  warranty_covered: false,
};

interface Assignment {
  technician_id: string;
  full_name: string;
  code?: string;
  phone?: string;
  is_lead: boolean;
  assigned_at: string;
}

type FormState = typeof EMPTY_FORM;

function WorkOrdersContent() {
  const { data, isLoading, error, create, update, remove, refresh } = useCrud<WorkOrder>("fsm/work-orders");
  const { data: customers } = useCrud<Customer>("fsm/customers");
  const { data: serviceTypes } = useCrud<ServiceType>("fsm/service-types");
  const { data: priorityLevels } = useCrud<PriorityLevel>("fsm/priority-levels");
  const { data: allTechnicians } = useCrud<Technician>("fsm/technicians");

  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [siteAssets, setSiteAssets] = useState<Asset[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [savedWoId, setSavedWoId] = useState<string | null>(null); // WO id after save (for assignment)
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTitle, setFilterTitle] = useState("");

  // Assignment state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [selectedIsLead, setSelectedIsLead] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Load sites by customer
  useEffect(() => {
    if (!form.customer_id) { setSites([]); return; }
    apiFetch(`fsm/customer-sites?customer_id=${form.customer_id}`)
      .then((r) => r.json())
      .then((json) => setSites(Array.isArray(json) ? json : (json.data ?? [])))
      .catch(() => setSites([]));
  }, [form.customer_id]);

  // Load assets by site
  useEffect(() => {
    if (!form.customer_site_id) { setSiteAssets([]); return; }
    apiFetch(`fsm/customer-sites/${form.customer_site_id}/assets`)
      .then((r) => r.json())
      .then((json) => setSiteAssets(json.data ?? []))
      .catch(() => setSiteAssets([]));
  }, [form.customer_site_id]);

  // Load assignments for current WO
  const loadAssignments = useCallback(async (woId: string) => {
    setAssignLoading(true);
    try {
      const res = await apiFetch(`fsm/work-orders/${woId}/assignments`);
      const json = await res.json();
      setAssignments(json.data ?? []);
    } catch { setAssignments([]); }
    finally { setAssignLoading(false); }
  }, []);

  useEffect(() => {
    const id = savedWoId ?? editing?.id;
    if (modalOpen && id) { loadAssignments(id); }
    else { setAssignments([]); }
  }, [modalOpen, savedWoId, editing?.id, loadAssignments]);

  const openCreate = () => {
    setEditing(null);
    setSavedWoId(null);
    setForm(EMPTY_FORM);
    setSites([]);
    setSiteAssets([]);
    setFormError(null);
    setSelectedTechId("");
    setSelectedIsLead(false);
    setModalOpen(true);
  };

  const openEdit = (row: WorkOrder) => {
    setEditing(row);
    setSavedWoId(null);
    setForm({
      title: row.title,
      customer_id: row.customer_id,
      customer_site_id: row.customer_site_id,
      asset_id: row.asset_id ?? "",
      service_type_id: row.service_type_id ?? "",
      priority_level_id: row.priority_level_id ?? "",
      status: row.status,
      description: row.description ?? "",
      scheduled_start: row.scheduled_start ? row.scheduled_start.slice(0, 16) : "",
      scheduled_end: row.scheduled_end ? row.scheduled_end.slice(0, 16) : "",
      repair_cost: row.repair_cost != null ? String(row.repair_cost) : "",
      warranty_covered: row.warranty_covered,
    });
    setFormError(null);
    setSelectedTechId("");
    setSelectedIsLead(false);
    setModalOpen(true);
  };

  const handleDelete = async (row: WorkOrder) => {
    if (!window.confirm(`Delete work order "${row.title}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Validate scheduled times
    if (form.scheduled_start && form.scheduled_end &&
        new Date(form.scheduled_start) > new Date(form.scheduled_end)) {
      setFormError("เวลาเริ่มต้องไม่เกินเวลาสิ้นสุด");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      asset_id: form.asset_id || null,
      service_type_id: form.service_type_id || null,
      priority_level_id: form.priority_level_id || null,
      scheduled_start: form.scheduled_start || null,
      scheduled_end: form.scheduled_end || null,
      repair_cost: form.repair_cost !== "" ? parseFloat(form.repair_cost) : null,
    };
    try {
      if (editing) {
        await update(editing.id, payload);
        // stay open for assignment management
        refresh();
      } else {
        // Create → capture the new ID from list refresh
        const res = await apiFetch("fsm/work-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Create failed");
        setSavedWoId(json.id);
        refresh();
      }
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!selectedTechId) return;
    const woId = savedWoId ?? editing?.id;
    if (!woId) return;
    setAssigning(true);
    try {
      const res = await apiFetch(`fsm/work-orders/${woId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technician_id: selectedTechId, is_lead: selectedIsLead }),
      });
      if (!res.ok) { const j = await res.json(); alert(j.error ?? "Assign failed"); return; }
      setSelectedTechId("");
      setSelectedIsLead(false);
      await loadAssignments(woId);
      refresh();
    } catch { alert("Network error"); }
    finally { setAssigning(false); }
  };

  const handleRemoveAssignment = async (techId: string) => {
    const woId = savedWoId ?? editing?.id;
    if (!woId) return;
    try {
      await apiFetch(`fsm/work-orders/${woId}/assignments/${techId}`, { method: "DELETE" });
      await loadAssignments(woId);
      refresh();
    } catch { alert("Remove failed"); }
  };

  // Warranty helper — check selected asset's warranty_expires_at
  const selectedAsset = siteAssets.find((a) => a.id === form.asset_id);
  const isInWarranty = !!(selectedAsset?.warranty_expires_at && new Date(selectedAsset.warranty_expires_at) > new Date());

  const currentWoId = savedWoId ?? editing?.id;
  const assignedTechIds = new Set(assignments.map((a) => a.technician_id));
  const availableTechs = allTechnicians.filter((t) => t.is_active && !assignedTechIds.has(t.id));
  const isSaved = !!(savedWoId || editing);

  const filteredData = useMemo(() => {
    return data.filter((wo) => {
      if (filterStatus && wo.status !== filterStatus) return false;
      if (filterTitle && !wo.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
      return true;
    });
  }, [data, filterStatus, filterTitle]);

  const columns: Column<WorkOrder>[] = [
    {
      key: "order_no", header: "Order No",
      render: (r) => <span className="font-mono text-xs text-slate-400">{r.order_no ?? "-"}</span>,
    },
    { key: "title", header: "Title", render: (r) => <span className="font-medium text-slate-200">{r.title}</span> },
    { key: "customer_name", header: "Customer" },
    { key: "site_name", header: "Site" },
    {
      key: "asset_name", header: "Asset",
      render: (r) => r.asset_name ? (
        <div>
          <span className="text-sm font-medium text-slate-200">{r.asset_name}</span>
          {r.asset_serial && <span className="block text-xs text-slate-500">{r.asset_serial}</span>}
        </div>
      ) : <span className="text-slate-600 text-sm">—</span>,
    },
    { key: "service_type_name", header: "Service Type", render: (r) => r.service_type_name ?? "-" },
    {
      key: "priority_name", header: "Priority",
      render: (r) => r.priority_name ? (
        <div className="flex items-center gap-1.5">
          {r.priority_color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.priority_color }} />}
          <span className="text-xs">{r.priority_name}</span>
        </div>
      ) : "-",
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "scheduled_start", header: "Scheduled Start",
      render: (r) => r.scheduled_start ? (
        <span className="font-mono text-xs text-slate-400">{new Date(r.scheduled_start).toLocaleString()}</span>
      ) : "-",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <PageHeader
        title="Work Orders"
        subtitle="Create and track field service work orders"
        action={<button onClick={openCreate} className="fsm-page-action">+ New Work Order</button>}
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <input type="text" placeholder="Search by title…" value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          className="w-60 border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-slate-600" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        {(filterStatus || filterTitle) && (
          <button onClick={() => { setFilterStatus(""); setFilterTitle(""); }} className="text-xs text-slate-500 hover:text-slate-300">
            Clear
          </button>
        )}
      </div>

      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={filteredData} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Edit Work Order" : savedWoId ? "Work Order Created" : "New Work Order"}
        size="lg">
        <div className="space-y-0">

          {/* ── DETAILS FORM ── */}
          {!savedWoId && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="fsm-label">Title *</label>
                <input required value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="fsm-input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fsm-label">Customer *</label>
                  <select required value={form.customer_id}
                    onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value, customer_site_id: "", asset_id: "" }))}
                    className="fsm-input">
                    <option value="">Select customer…</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fsm-label">Site *</label>
                  <select required value={form.customer_site_id}
                    onChange={(e) => setForm((f) => ({ ...f, customer_site_id: e.target.value, asset_id: "" }))}
                    className="fsm-input" disabled={!form.customer_id}>
                    <option value="">Select site…</option>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="fsm-label">Asset (สิ่งของที่ต้องซ่อม)</label>
                <select value={form.asset_id}
                  onChange={(e) => {
                    const assetId = e.target.value;
                    const asset = siteAssets.find((a) => a.id === assetId);
                    const inWarranty = !!(asset?.warranty_expires_at && new Date(asset.warranty_expires_at) > new Date());
                    setForm((f) => ({ ...f, asset_id: assetId, warranty_covered: inWarranty }));
                  }}
                  className="fsm-input" disabled={!form.customer_site_id}>
                  <option value="">— ไม่ระบุ —</option>
                  {siteAssets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.serial_no ? ` (${a.serial_no})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fsm-label">Service Type</label>
                  <select value={form.service_type_id}
                    onChange={(e) => setForm((f) => ({ ...f, service_type_id: e.target.value }))}
                    className="fsm-input">
                    <option value="">None</option>
                    {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fsm-label">Priority</label>
                  <select value={form.priority_level_id}
                    onChange={(e) => setForm((f) => ({ ...f, priority_level_id: e.target.value }))}
                    className="fsm-input">
                    <option value="">None</option>
                    {priorityLevels.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="fsm-label">Status</label>
                <select value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="fsm-input">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Repair cost + warranty */}
              <div className="flex items-end gap-4 rounded border border-slate-800 bg-slate-900/40 px-3 py-3">
                <div className="flex-1">
                  <label className="fsm-label">Repair Cost (THB)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.repair_cost}
                    onChange={(e) => setForm((f) => ({ ...f, repair_cost: e.target.value }))}
                    placeholder="0.00"
                    className="fsm-input"
                  />
                </div>
                <div className="pb-1">
                  <label className={`flex items-center gap-2 text-sm ${isInWarranty ? "text-emerald-400" : "text-slate-500"}`}>
                    <input
                      type="checkbox"
                      checked={!!(isInWarranty && form.warranty_covered)}
                      disabled={!isInWarranty}
                      onChange={(e) => setForm((f) => ({ ...f, warranty_covered: e.target.checked, repair_cost: e.target.checked ? "" : f.repair_cost }))}
                      className="h-4 w-4 accent-emerald-400"
                    />
                    {isInWarranty ? "🛡 Warranty covers" : "Not under warranty"}
                  </label>
                  {selectedAsset?.warranty_expires_at && (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Expires {new Date(selectedAsset.warranty_expires_at).toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="fsm-label">Description</label>
                <textarea value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} className="fsm-input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fsm-label">Scheduled Start</label>
                  <input type="datetime-local" value={form.scheduled_start}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_start: e.target.value }))}
                    className="fsm-input" />
                </div>
                <div>
                  <label className="fsm-label">Scheduled End</label>
                  <input type="datetime-local" value={form.scheduled_end}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_end: e.target.value }))}
                    className="fsm-input" />
                </div>
              </div>

              {formError && <p className="fsm-error">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                {!editing && (
                  <button type="button" onClick={() => setModalOpen(false)} className="fsm-btn-cancel">Cancel</button>
                )}
                <button type="submit" disabled={saving} className="fsm-btn-primary">
                  {saving ? "Saving…" : editing ? "Update Details" : "Save & Assign Technicians →"}
                </button>
              </div>
            </form>
          )}

          {/* ── TECHNICIAN ASSIGNMENT SECTION ── shown after save or when editing ── */}
          {isSaved && (
            <div className={savedWoId ? "" : "mt-2 border-t border-slate-800 pt-4"}>
              {savedWoId && (
                <div className="mb-4 rounded border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">
                  ✅ Work order created — now assign technicians below
                </div>
              )}
              <label className="fsm-label mb-2 block">Technicians (ผู้รับผิดชอบ)</label>

              {/* Current assignments */}
              {assignLoading ? (
                <div className="mb-3 text-xs text-slate-500">Loading…</div>
              ) : assignments.length > 0 ? (
                <div className="mb-3 space-y-2">
                  {assignments.map((a) => (
                    <div key={a.technician_id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {a.is_lead && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            Lead
                          </span>
                        )}
                        <span className="text-sm text-slate-200">{a.full_name}</span>
                        {a.code && <span className="text-xs text-slate-500">{a.code}</span>}
                        {a.phone && <span className="text-xs text-slate-600">{a.phone}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(a.technician_id)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-3 text-xs text-slate-600">ยังไม่มีช่างที่ได้รับมอบหมาย</p>
              )}

              {/* Add technician */}
              {availableTechs.length > 0 && (
                <div className="flex items-center gap-2">
                  <select value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)}
                    className="fsm-input flex-1">
                    <option value="">Select technician…</option>
                    {availableTechs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}{t.code ? ` (${t.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                    <input type="checkbox" checked={selectedIsLead}
                      onChange={(e) => setSelectedIsLead(e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-400" />
                    Lead
                  </label>
                  <button type="button" disabled={!selectedTechId || assigning}
                    onClick={handleAssign}
                    className="fsm-btn-primary shrink-0 disabled:opacity-40">
                    {assigning ? "…" : "+ Assign"}
                  </button>
                </div>
              )}
              {availableTechs.length === 0 && assignments.length > 0 && (
                <p className="text-xs text-slate-600">Active technicians ทุกคน assigned แล้ว</p>
              )}

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setModalOpen(false)} className="fsm-btn-primary">
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </Modal>
    </div>
  );
}

export default function WorkOrdersPage() {
  return <AuthGuard><WorkOrdersContent /></AuthGuard>;
}
