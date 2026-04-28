"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { apiFetch } from "@/lib/api";
import { Technician, UserItem } from "@/lib/types";

const EMPTY_FORM = { user_id: "", code: "", full_name: "", phone: "", email: "", is_active: true };

function TechniciansContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<Technician>("fsm/technicians");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("fsm/users").then((r) => r.json()).then((j) => setUsers(j.data ?? [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };
  const openEdit = (row: Technician) => {
    setEditing(row);
    setForm({ user_id: row.user_id ? String(row.user_id) : "", code: row.code ?? "", full_name: row.full_name, phone: row.phone ?? "", email: row.email ?? "", is_active: row.is_active });
    setFormError(null);
    setModalOpen(true);
  };
  const handleDelete = async (row: Technician) => {
    if (!window.confirm(`Delete technician "${row.full_name}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError(null);
    const payload = {
      ...form,
      user_id: form.user_id ? Number(form.user_id) : null,
      code: form.code || null,
      phone: form.phone || null,
      email: form.email || null,
    };
    try {
      if (editing) { await update(editing.id, payload); } else { await create(payload); }
      setModalOpen(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const columns: Column<Technician>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-slate-400">{r.code ?? "-"}</span> },
    { key: "full_name", header: "Full Name", render: (r) => <span className="font-medium text-slate-200">{r.full_name}</span> },
    { key: "username", header: "System User", render: (r) => r.username ? <span className="text-xs text-amber-400">@{r.username}</span> : <span className="text-xs text-slate-600">—</span> },
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
      <PageHeader title="Technicians" subtitle="Manage field technicians"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Technician</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Technician" : "New Technician"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* System user link */}
          <div>
            <label className="fsm-label">System User (Login Account)</label>
            <select value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} className="fsm-input">
              <option value="">— ไม่ผูกกับ user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>@{u.username} ({u.email})</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-600">เลือก user ที่จะใช้ login เป็น technician คนนี้</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Code</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Full Name *</label>
              <input required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="fsm-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="fsm-input" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="tech_is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 accent-amber-400" />
            <label htmlFor="tech_is_active" className="text-sm text-slate-400">Active</label>
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

export default function TechniciansPage() {
  return <AuthGuard><TechniciansContent /></AuthGuard>;
}
