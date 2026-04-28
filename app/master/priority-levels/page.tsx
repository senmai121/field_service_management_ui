"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { PriorityLevel } from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  display_order: 0,
  response_hours: "",
  resolve_hours: "",
  color_hex: "#f59e0b",
};

function PriorityLevelsContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<PriorityLevel>("fsm/priority-levels");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PriorityLevel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };
  const openEdit = (row: PriorityLevel) => {
    setEditing(row);
    setForm({
      name: row.name,
      display_order: row.display_order,
      response_hours: row.response_hours != null ? String(row.response_hours) : "",
      resolve_hours: row.resolve_hours != null ? String(row.resolve_hours) : "",
      color_hex: row.color_hex ?? "#f59e0b",
    });
    setFormError(null);
    setModalOpen(true);
  };
  const handleDelete = async (row: PriorityLevel) => {
    if (!window.confirm(`Delete priority level "${row.name}"?`)) return;
    try { await remove(row.id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError(null);
    const payload = {
      name: form.name,
      display_order: Number(form.display_order),
      response_hours: form.response_hours !== "" ? Number(form.response_hours) : null,
      resolve_hours: form.resolve_hours !== "" ? Number(form.resolve_hours) : null,
      color_hex: form.color_hex || null,
    };
    try {
      if (editing) { await update(editing.id, payload); } else { await create(payload); }
      setModalOpen(false);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const columns: Column<PriorityLevel>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "response_hours", header: "Response Hrs", render: (r) => r.response_hours != null ? String(r.response_hours) : "-" },
    { key: "resolve_hours", header: "Resolve Hrs", render: (r) => r.resolve_hours != null ? String(r.resolve_hours) : "-" },
    {
      key: "color_hex", header: "Color",
      render: (r) => r.color_hex ? (
        <div className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 rounded-full border border-slate-600" style={{ backgroundColor: r.color_hex }} />
          <span className="font-mono text-xs text-slate-500">{r.color_hex}</span>
        </div>
      ) : "-",
    },
    { key: "display_order", header: "Order", render: (r) => String(r.display_order) },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <PageHeader title="Priority Levels" subtitle="Manage work order priority levels"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Priority Level</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Priority Level" : "New Priority Level"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsm-label">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="fsm-input" />
          </div>
          <div>
            <label className="fsm-label">Display Order</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} className="fsm-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="fsm-label">Response Hours</label>
              <input type="number" value={form.response_hours} onChange={(e) => setForm((f) => ({ ...f, response_hours: e.target.value }))} className="fsm-input" />
            </div>
            <div>
              <label className="fsm-label">Resolve Hours</label>
              <input type="number" value={form.resolve_hours} onChange={(e) => setForm((f) => ({ ...f, resolve_hours: e.target.value }))} className="fsm-input" />
            </div>
          </div>
          <div>
            <label className="fsm-label">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                className="h-9 w-12 cursor-pointer border border-slate-700 bg-slate-800 p-0.5" />
              <input value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                className="fsm-input flex-1" placeholder="#f59e0b" />
            </div>
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

export default function PriorityLevelsPage() {
  return <AuthGuard><PriorityLevelsContent /></AuthGuard>;
}
