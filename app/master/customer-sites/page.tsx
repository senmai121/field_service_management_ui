"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { CustomerSite, Customer } from "@/lib/types";

// Dynamic imports — Leaflet requires browser APIs
const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });
const MapView = dynamic(() => import("@/components/ui/MapView"), { ssr: false });

const EMPTY_FORM = {
  customer_id: "",
  name: "",
  address: "",
  is_active: true,
  latitude: null as number | null,
  longitude: null as number | null,
};

function CustomerSitesContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<CustomerSite>("fsm/customer-sites");
  const { data: customers } = useCrud<Customer>("fsm/customers");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewSite, setViewSite] = useState<CustomerSite | null>(null);
  const [editing, setEditing] = useState<CustomerSite | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: CustomerSite) => {
    setEditing(row);
    setForm({
      customer_id: row.customer_id,
      name: row.name,
      address: row.address ?? "",
      is_active: row.is_active,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async (row: CustomerSite) => {
    if (!window.confirm(`Delete site "${row.name}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError(null);
    const payload = {
      ...form,
      address: form.address || null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
    };
    try {
      if (editing) { await update(editing.id, payload); } else { await create(payload); }
      setModalOpen(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const columns: Column<CustomerSite>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "customer_id", header: "Customer", render: (r) => customerMap.get(r.customer_id) ?? r.customer_id },
    { key: "address", header: "Address", render: (r) => r.address ?? "-" },
    {
      key: "latitude", header: "Location",
      render: (r) => r.latitude && r.longitude ? (
        <button
          onClick={() => setViewSite(r)}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          📍 ดูแผนที่
        </button>
      ) : <span className="text-xs text-slate-600">—</span>,
    },
    {
      key: "is_active", header: "Status",
      render: (r) => (
        <span className={r.is_active ? "fsm-badge-active" : "fsm-badge-inactive"}>
          {r.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <PageHeader title="Customer Sites" subtitle="Manage customer locations and sites"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Site</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      {/* View-only map modal */}
      <Modal isOpen={!!viewSite} onClose={() => setViewSite(null)} title={`📍 ${viewSite?.name ?? ""}`} size="lg">
        {viewSite?.latitude && viewSite?.longitude && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">{viewSite.address}</p>
            <MapView
              lat={viewSite.latitude}
              lng={viewSite.longitude}
              label={viewSite.name}
              height="360px"
            />
          </div>
        )}
      </Modal>

      {/* Create / Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer Site" : "New Customer Site"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsm-label">Customer *</label>
            <select required value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))} className="fsm-input">
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="fsm-label">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="fsm-input" />
          </div>
          <div>
            <label className="fsm-label">Address</label>
            <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="fsm-input" />
          </div>
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="site_is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-amber-400" />
            <label htmlFor="site_is_active" className="text-sm text-slate-400">Active</label>
          </div>

          {/* Map section */}
          <div>
            <label className="fsm-label">ตำแหน่งบนแผนที่ (ไม่บังคับ)</label>
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) =>
                setForm((f) => ({
                  ...f,
                  latitude: lat === 0 && lng === 0 ? null : lat,
                  longitude: lat === 0 && lng === 0 ? null : lng,
                }))
              }
              height="280px"
            />
          </div>

          {formError && <p className="fsm-error">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="fsm-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="fsm-btn-primary">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CustomerSitesPage() {
  return <AuthGuard><CustomerSitesContent /></AuthGuard>;
}
