import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Field from '../components/Field.jsx';
import PageHeading from '../components/PageHeading.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getRecords, putRecords } from '../services/offlineStore.js';
import { performMutation } from '../services/optimistic.js';
import { createTask, deleteTask, getTasks, setTaskStatus } from '../services/tasks.js';

const emptyForm = { title: '', description: '', priority: 'medium', due_at: '' };

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const priorityStyle = {
  high: 'border-scarlet-500/40 text-scarlet-200',
  medium: 'border-slate-400/40 text-slate-300',
  low: 'border-egyptian-400/40 text-slate-300',
};

const applyFilters = (rows, filters) => rows.filter((task) => {
  if (filters.status !== 'all' && task.status !== filters.status) return false;
  if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
  return true;
});

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== 'all'));
    try {
      const rows = await getTasks(query);
      if (user?.id) await putRecords(user.id, 'tasks', rows).catch(() => null);
      setTasks(rows);
    } catch (error) {
      if (user?.id) {
        const cached = await getRecords(user.id, 'tasks').catch(() => []);
        setTasks(applyFilters(cached, filters));
      }
      if (navigator.onLine) Swal.fire({ icon: 'error', title: 'Could not load tasks', text: error.message });
    } finally {
      setLoading(false);
    }
  }, [filters, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const values = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_at: form.due_at ? new Date(`${form.due_at}T12:00:00`).toISOString() : null,
    };
    const temporaryId = crypto.randomUUID();
    const local = {
      id: temporaryId,
      ...values,
      status: 'pending',
      created_at: new Date().toISOString(),
      version: 1,
      pending: true,
    };
    try {
      await performMutation({
        operation: { userId: user?.id, type: 'task.create', targetId: temporaryId, payload: values, localRecord: local },
        apply: () => setTasks((current) => [local, ...current]),
        revert: () => setTasks((current) => current.filter((task) => task.id !== temporaryId)),
        request: (headers) => createTask(values, headers),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not create task', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (task) => {
    const status = task.status === 'completed' ? 'pending' : 'completed';
    const local = { ...task, status, pending: true };
    try {
      await performMutation({
        operation: {
          userId: user?.id,
          type: 'task.status',
          targetId: task.id,
          payload: { status },
          baseVersion: task.version,
          localRecord: local,
        },
        apply: () => setTasks((current) => current.map((item) => (item.id === task.id ? local : item))),
        revert: () => setTasks((current) => current.map((item) => (item.id === task.id ? task : item))),
        request: (headers) => setTaskStatus(task.id, status, headers),
      });
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not update task', text: error.message });
    }
  };

  const handleDelete = async (task) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this task?',
      text: task.title,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#c62f3c',
    });
    if (!result.isConfirmed) return;
    try {
      await performMutation({
        operation: {
          userId: user?.id,
          type: 'task.delete',
          targetId: task.id,
          payload: {},
          localRecord: task,
        },
        apply: () => setTasks((current) => current.filter((item) => item.id !== task.id)),
        revert: () => setTasks((current) => [...current, task]),
        request: (headers) => deleteTask(task.id, headers),
      });
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not delete task', text: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Productivity"
        title="Tasks"
        description="Capture what matters, then work through it one item at a time."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            {showForm ? 'Close' : 'New task'}
          </button>
        }
      />

      {showForm ? (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
          <Field label="Title" name="title" value={form.title} onChange={update} />
          <Field label="Priority" name="priority" value={form.priority} onChange={update} options={priorityOptions} />
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-300">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="2"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
          </label>
          <Field label="Due date" type="date" name="due_at" value={form.due_at} onChange={update} />
          <div className="flex items-end">
            <SubmitButton busy={busy}>Save task</SubmitButton>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          ['status', ['all', 'pending', 'completed']],
          ['priority', ['all', 'high', 'medium', 'low']],
        ].map(([key, options]) => (
          <div key={key} className="flex items-center gap-1 rounded-lg border border-white/10 p-1 text-xs">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, [key]: option }))}
                className={`rounded-md px-2 py-1 capitalize ${
                  filters[key] === option ? 'bg-egyptian-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
          No tasks yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleToggle(task)}
                className="mt-1 h-5 w-5 accent-egyptian-400"
                aria-label={`Mark ${task.title} as complete`}
              />
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {task.title}
                </p>
                {task.description ? <p className="mt-1 text-sm text-slate-400">{task.description}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 capitalize ${priorityStyle[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.due_at ? (
                    <span className="text-slate-500">Due {new Date(task.due_at).toLocaleDateString()}</span>
                  ) : null}
                  {task.pending ? <span className="text-egyptian-400">Waiting to sync</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(task)}
                className="rounded-lg px-2 py-1 text-xs text-scarlet-200 hover:bg-scarlet-600/20"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
