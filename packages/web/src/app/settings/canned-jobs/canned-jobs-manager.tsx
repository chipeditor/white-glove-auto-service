'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface CannedJob {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  labor_hours: number | null;
  labor_rate: number | null;
  parts_cost: number | null;
  total_estimate: number | null;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  jobs: CannedJob[];
  orgId: string;
  isAdmin: boolean;
}

const INPUT = 'w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50';
const CATEGORIES = ['Maintenance', 'Brakes', 'Engine', 'Transmission', 'Suspension', 'Climate', 'Electrical', 'Diagnostics', 'Detailing', 'Other'];

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const emptyJob = {
  name: '',
  description: '',
  category: 'Maintenance',
  labor_hours: '',
  labor_rate: '150.00',
  parts_cost: '',
};

export function CannedJobsManager({ jobs, orgId, isAdmin }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyJob);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(job: CannedJob) {
    setForm({
      name: job.name,
      description: job.description ?? '',
      category: job.category ?? 'Maintenance',
      labor_hours: job.labor_hours?.toString() ?? '',
      labor_rate: job.labor_rate?.toString() ?? '150.00',
      parts_cost: job.parts_cost?.toString() ?? '',
    });
    setEditingId(job.id);
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    const laborHours = parseFloat(form.labor_hours) || 0;
    const laborRate = parseFloat(form.labor_rate) || 0;
    const partsCost = parseFloat(form.parts_cost) || 0;
    const totalEstimate = laborHours * laborRate + partsCost;

    const record = {
      organization_id: orgId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      labor_hours: laborHours,
      labor_rate: laborRate,
      parts_cost: partsCost,
      total_estimate: totalEstimate,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from('canned_jobs').update(record).eq('id', editingId);
    } else {
      await supabase.from('canned_jobs').insert({ ...record, sort_order: jobs.length });
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from('canned_jobs').delete().eq('id', id);
    setDeleting(null);
    router.refresh();
  }

  async function toggleActive(job: CannedJob) {
    const supabase = createClient();
    await supabase.from('canned_jobs').update({ is_active: !job.is_active, updated_at: new Date().toISOString() }).eq('id', job.id);
    router.refresh();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium text-wg-text">Service Templates</h2>
          <p className="text-xs text-wg-muted mt-0.5">Pre-built service packages for quick estimate building</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90"
          >
            <Plus size={14} />
            Add Template
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-wg-card rounded-xl border border-wg-border p-5 mb-4">
          <h3 className="text-sm font-medium text-wg-text mb-4">
            {editingId ? 'Edit Template' : 'New Template'}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-wg-muted mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Full Synthetic Oil Change"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs text-wg-muted mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={INPUT + ' appearance-none'}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-wg-muted mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the service..."
                className={INPUT + ' resize-none'}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-wg-muted mb-1">Labor Hours</label>
                <input
                  type="number"
                  step="0.25"
                  value={form.labor_hours}
                  onChange={(e) => setForm({ ...form, labor_hours: e.target.value })}
                  placeholder="0.5"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs text-wg-muted mb-1">Labor Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.labor_rate}
                  onChange={(e) => setForm({ ...form, labor_rate: e.target.value })}
                  placeholder="150.00"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs text-wg-muted mb-1">Parts Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.parts_cost}
                  onChange={(e) => setForm({ ...form, parts_cost: e.target.value })}
                  placeholder="45.00"
                  className={INPUT}
                />
              </div>
            </div>
            {(form.labor_hours || form.parts_cost) && (
              <p className="text-xs text-wg-text2">
                Estimated total: <span className="font-medium text-wg-text">
                  {formatCurrency((parseFloat(form.labor_hours) || 0) * (parseFloat(form.labor_rate) || 0) + (parseFloat(form.parts_cost) || 0))}
                </span>
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90 disabled:opacity-50"
              >
                <Check size={14} />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 px-4 py-2 text-wg-text2 hover:text-wg-text text-sm"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 && !showForm ? (
        <div className="bg-wg-card rounded-xl border border-wg-border p-8 text-center">
          <p className="text-sm text-wg-muted">No service templates yet.</p>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-wg-blue hover:text-wg-blue/80"
            >
              Create your first template
            </button>
          )}
        </div>
      ) : (
        <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-wg-border">
                <th className="text-left text-xs font-medium text-wg-muted uppercase tracking-wider px-4 py-3">Template</th>
                <th className="text-left text-xs font-medium text-wg-muted uppercase tracking-wider px-4 py-3 w-24">Category</th>
                <th className="text-right text-xs font-medium text-wg-muted uppercase tracking-wider px-4 py-3 w-20">Hours</th>
                <th className="text-right text-xs font-medium text-wg-muted uppercase tracking-wider px-4 py-3 w-24">Estimate</th>
                <th className="text-center text-xs font-medium text-wg-muted uppercase tracking-wider px-4 py-3 w-20">Active</th>
                {isAdmin && <th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-wg-border last:border-0 hover:bg-wg-card-hover transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-wg-text">{job.name}</p>
                    {job.description && (
                      <p className="text-xs text-wg-muted mt-0.5 line-clamp-1">{job.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-wg-text2">{job.category ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-wg-text2 tabular-nums">{job.labor_hours ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-wg-text tabular-nums">{formatCurrency(job.total_estimate)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(job)}
                      className={`w-8 h-5 rounded-full transition-colors ${job.is_active ? 'bg-wg-green' : 'bg-wg-border'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${job.is_active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(job)}
                          className="p-1.5 text-wg-muted hover:text-wg-text transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deleting === job.id}
                          className="p-1.5 text-wg-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
