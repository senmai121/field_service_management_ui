"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCrud } from "@/lib/useCrud";
import { SkillCategory } from "@/lib/types";

const EMPTY_FORM = { name: "", description: "" };

function SkillCategoriesContent() {
  const { data, isLoading, error, create, update, remove } = useCrud<SkillCategory>("fsm/skill-categories");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SkillCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };
  const openEdit = (row: SkillCategory) => {
    setEditing(row);
    setForm({ name: row.name, description: row.description ?? "" });
    setFormError(null);
    setModalOpen(true);
  };
  const handleDelete = async (row: SkillCategory) => {
    if (!window.confirm(`Delete skill category "${row.name}"?`)) return;
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

  const columns: Column<SkillCategory>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-slate-200">{r.name}</span> },
    { key: "description", header: "Description", render: (r) => r.description ?? "-" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <PageHeader title="Skill Categories" subtitle="Manage technician skill categories"
        action={<button onClick={openCreate} className="fsm-page-action">+ Add Skill Category</button>} />
      {error && <p className="mb-4 fsm-error">{error}</p>}
      <DataTable columns={columns} data={data} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Skill Category" : "New Skill Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fsm-label">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="fsm-input" />
          </div>
          <div>
            <label className="fsm-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="fsm-input" />
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

export default function SkillCategoriesPage() {
  return <AuthGuard><SkillCategoriesContent /></AuthGuard>;
}
