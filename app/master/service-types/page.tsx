"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { ServiceType } from "@/lib/types";

const EMPTY_FORM = { name: "", description: "", is_active: true };

function ServiceTypesContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<ServiceType>("fsm/service-types");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };
  const openEdit = (row: ServiceType) => {
    setEditing(row);
    setForm({ name: row.name, description: row.description ?? "", is_active: row.is_active });
    setFormError(null);
    setModalOpen(true);
  };
  const handleDelete = async (row: ServiceType) => {
    if (!window.confirm(`Delete service type "${row.name}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      if (editing) { await update(editing.id, form); } else { await create(form); }
      setModalOpen(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const columns: Column<ServiceType>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "description", header: "Description", render: (r) => r.description ?? "-" },
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
      <PageHeader title="Service Types" subtitle="Manage service type definitions"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Service Type</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Service Type" : "New Service Type"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsm-label">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="fsm-input" />
          </div>
          <div>
            <label className="fsm-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="fsm-input" />
          </div>
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-amber-400" />
            <label htmlFor="is_active" className="text-sm text-slate-400">Active</label>
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

export default function ServiceTypesPage() {
  return <AuthGuard><ServiceTypesContent /></AuthGuard>;
}
