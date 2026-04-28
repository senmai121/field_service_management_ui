"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { apiFetch } from "@/lib/api";
import { Asset, CustomerSite, AssetCategory } from "@/lib/types";

// Dynamic imports — Leaflet requires browser APIs
const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });
const MapView = dynamic(() => import("@/components/ui/MapView"), { ssr: false });

const EMPTY_FORM = {
  customer_site_id: "",
  name: "",
  asset_category_id: "",
  serial_no: "",
  brand: "",
  model: "",
  status: "active",
  installed_at: "",
  warranty_expires_at: "",
  notes: "",
  latitude: null as number | null,
  longitude: null as number | null,
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  inactive: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  decommissioned: "bg-red-500/15 text-red-400 border border-red-500/30",
};

function AssetsContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<Asset>("fsm/assets");
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("fsm/customer-sites")
      .then((r) => r.json())
      .then((j) => setSites(j.data ?? []))
      .catch(() => {});
    apiFetch("fsm/asset-categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Asset) => {
    setEditing(row);
    setForm({
      customer_site_id: row.customer_site_id,
      name: row.name,
      asset_category_id: row.asset_category_id ?? "",
      serial_no: row.serial_no ?? "",
      brand: row.brand ?? "",
      model: row.model ?? "",
      status: row.status,
      installed_at: row.installed_at ? row.installed_at.slice(0, 10) : "",
      warranty_expires_at: row.warranty_expires_at ? row.warranty_expires_at.slice(0, 10) : "",
      notes: row.notes ?? "",
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async (row: Asset) => {
    if (!window.confirm(`Delete asset "${row.name}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      ...form,
      asset_category_id: form.asset_category_id || null,
      serial_no: form.serial_no || null,
      brand: form.brand || null,
      model: form.model || null,
      installed_at: form.installed_at || null,
      warranty_expires_at: form.warranty_expires_at || null,
      notes: form.notes || null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
    };
    try {
      if (editing) { await update(editing.id, payload); } else { await create(payload); }
      setModalOpen(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const columns: Column<Asset>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "serial_no", header: "Serial No", render: (r) => <span className="font-mono text-xs text-slate-400">{r.serial_no ?? "—"}</span> },
    { key: "category_name", header: "Category", render: (r) => r.category_name ?? "—" },
    {
      key: "customer_name", header: "Customer / Site",
      render: (r) => (
        <div>
          <span className="text-sm text-slate-300">{r.customer_name}</span>
          <span className="mx-1 text-slate-600">›</span>
          <span className="text-sm text-slate-400">{r.site_name}</span>
        </div>
      ),
    },
    {
      key: "brand", header: "Brand / Model",
      render: (r) => {
        const bm = [r.brand, r.model].filter(Boolean).join(" ");
        return <span className="text-sm text-slate-400">{bm || "—"}</span>;
      },
    },
    {
      key: "status", header: "Status",
      render: (r) => (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[r.status] ?? ""}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "latitude", header: "Location",
      render: (r) => r.latitude && r.longitude ? (
        <span className="text-xs text-blue-400">📍 {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
      ) : <span className="text-xs text-slate-600">—</span>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <PageHeader
        title="Assets"
        subtitle="Manage customer equipment and devices"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Asset</button>}
      />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Asset" : "New Asset"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Customer Site *</label>
              <select required value={form.customer_site_id}
                onChange={(e) => setForm((f) => ({ ...f, customer_site_id: e.target.value }))}
                className="fsm-input">
                <option value="">Select site…</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fsm-label">Category</label>
              <select value={form.asset_category_id}
                onChange={(e) => setForm((f) => ({ ...f, asset_category_id: e.target.value }))}
                className="fsm-input">
                <option value="">— ไม่ระบุ —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Name *</label>
              <input required value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Serial No</label>
              <input value={form.serial_no}
                onChange={(e) => setForm((f) => ({ ...f, serial_no: e.target.value }))}
                className="fsm-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Brand</label>
              <input value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Model</label>
              <input value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="fsm-input" />
            </div>
          </div>

          <div>
            <label className="fsm-label">Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="fsm-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Installed At</label>
              <input type="date" value={form.installed_at}
                onChange={(e) => setForm((f) => ({ ...f, installed_at: e.target.value }))}
                className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Warranty Expires</label>
              <input type="date" value={form.warranty_expires_at}
                onChange={(e) => setForm((f) => ({ ...f, warranty_expires_at: e.target.value }))}
                className="fsm-input" />
            </div>
          </div>

          <div>
            <label className="fsm-label">Notes</label>
            <textarea value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} className="fsm-input" />
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

export default function AssetsPage() {
  return <AuthGuard><AssetsContent /></AuthGuard>;
}
