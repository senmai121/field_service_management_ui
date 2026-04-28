"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { Customer } from "@/lib/types";

const EMPTY_FORM = { code: "", name: "", tax_id: "", email: "", phone: "", address: "", is_active: true };

function CustomersContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<Customer>("fsm/customers");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };
  const openEdit = (row: Customer) => {
    setEditing(row);
    setForm({ code: row.code ?? "", name: row.name, tax_id: row.tax_id ?? "", email: row.email ?? "", phone: row.phone ?? "", address: row.address ?? "", is_active: row.is_active });
    setFormError(null);
    setModalOpen(true);
  };
  const handleDelete = async (row: Customer) => {
    if (!window.confirm(`Delete customer "${row.name}"?`)) return;
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

  const columns: Column<Customer>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-slate-400">{r.code ?? "-"}</span> },
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "-" },
    { key: "email", header: "Email", render: (r) => r.email ?? "-" },
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
      <PageHeader title="Customers" subtitle="Manage customer accounts"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Customer</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "New Customer"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Code</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Name *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="fsm-input" />
            </div>
          </div>
          <div>
            <label className="fsm-label">Tax ID</label>
            <input value={form.tax_id} onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))} className="fsm-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="fsm-input" />
            </div>
          </div>
          <div>
            <label className="fsm-label">Address</label>
            <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="fsm-input" />
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

export default function CustomersPage() {
  return <AuthGuard><CustomersContent /></AuthGuard>;
}
