import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Field from '../components/Field.jsx';
import PageHeading from '../components/PageHeading.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getRecords, putRecords } from '../services/offlineStore.js';
import { performMutation } from '../services/optimistic.js';
import { addCompletion, createHabit, deleteHabit, getCompletions, getHabits, removeCompletion } from '../services/habits.js';

const emptyForm = { name: '', description: '', frequency: 'daily', target: 1 };

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const targetOptions = Array.from({ length: 7 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

const today = () => new Date().toISOString().slice(0, 10);

const shiftDate = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const streakFor = (dates) => {
  const values = new Set(dates);
  let cursor = today();
  if (!values.has(cursor)) cursor = shiftDate(cursor, -1);
  let streak = 0;
  while (values.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
};

export default function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [datesByHabit, setDatesByHabit] = useState(new Map());
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const applyCompletions = (rows) => {
    setCompleted(new Set(rows.filter((item) => item.completed_on === today()).map((item) => item.habit_id)));
    const grouped = new Map();
    rows.forEach((item) => {
      const dates = grouped.get(item.habit_id) || [];
      dates.push(item.completed_on);
      grouped.set(item.habit_id, dates);
    });
    setDatesByHabit(grouped);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [habitRows, completionRows] = await Promise.all([getHabits(), getCompletions()]);
      setHabits(habitRows);
      applyCompletions(completionRows);
      if (user?.id) {
        await Promise.all([
          putRecords(user.id, 'habits', habitRows).catch(() => null),
          putRecords(user.id, 'completions', completionRows).catch(() => null),
        ]);
      }
    } catch (error) {
      if (user?.id) {
        const [habitRows, completionRows] = await Promise.all([
          getRecords(user.id, 'habits').catch(() => []),
          getRecords(user.id, 'completions').catch(() => []),
        ]);
        setHabits(habitRows);
        applyCompletions(completionRows);
      }
      if (navigator.onLine) Swal.fire({ icon: 'error', title: 'Could not load habits', text: error.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const values = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      frequency: form.frequency,
      target: Number(form.target),
    };
    const temporaryId = crypto.randomUUID();
    const local = { id: temporaryId, ...values, created_at: new Date().toISOString(), version: 1, pending: true };
    try {
      await performMutation({
        operation: { userId: user?.id, type: 'habit.create', targetId: temporaryId, payload: values, localRecord: local },
        apply: () => setHabits((current) => [local, ...current]),
        revert: () => setHabits((current) => current.filter((habit) => habit.id !== temporaryId)),
        request: (headers) => createHabit(values, headers),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not create habit', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (habit) => {
    const date = today();
    const isDone = completed.has(habit.id);
    const targetId = `${habit.id}:${date}`;
    const payload = { habit_id: habit.id, completed_on: date };
    const localRecord = { id: targetId, ...payload };
    const apply = () => {
      setCompleted((current) => {
        const next = new Set(current);
        if (isDone) next.delete(habit.id);
        else next.add(habit.id);
        return next;
      });
      setDatesByHabit((current) => {
        const next = new Map(current);
        const dates = new Set(next.get(habit.id) || []);
        if (isDone) dates.delete(date);
        else dates.add(date);
        next.set(habit.id, [...dates]);
        return next;
      });
    };
    try {
      await performMutation({
        operation: {
          userId: user?.id,
          type: isDone ? 'habit.completion.remove' : 'habit.completion.add',
          targetId,
          payload,
          localRecord,
        },
        apply,
        revert: apply,
        request: (headers) => (isDone ? removeCompletion(habit.id, date, headers) : addCompletion(habit.id, date, headers)),
      });
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not update habit', text: error.message });
    }
  };

  const handleDelete = async (habit) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this habit?',
      text: habit.name,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#c62f3c',
    });
    if (!result.isConfirmed) return;
    try {
      await performMutation({
        operation: { userId: user?.id, type: 'habit.delete', targetId: habit.id, payload: {}, localRecord: habit },
        apply: () => setHabits((current) => current.filter((item) => item.id !== habit.id)),
        revert: () => setHabits((current) => [...current, habit]),
        request: (headers) => deleteHabit(habit.id, headers),
      });
      await load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not delete habit', text: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Consistency"
        title="Habits"
        description="Small repeated actions beat occasional intensity."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            {showForm ? 'Close' : 'New habit'}
          </button>
        }
      />

      {showForm ? (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
          <Field label="Name" name="name" value={form.name} onChange={update} />
          <Field label="Frequency" name="frequency" value={form.frequency} onChange={update} options={frequencyOptions} />
          <Field label="Weekly target" name="target" value={String(form.target)} onChange={update} options={targetOptions} />
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
          <div className="flex items-end sm:col-span-2">
            <SubmitButton busy={busy}>Save habit</SubmitButton>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : habits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
          No habits yet. Start with one you can repeat tomorrow.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {habits.map((habit) => {
            const isDone = completed.has(habit.id);
            return (
              <div key={habit.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{habit.name}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {habit.frequency} · target {habit.target}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(habit)}
                    className="rounded-lg px-2 py-1 text-xs text-scarlet-200 hover:bg-scarlet-600/20"
                  >
                    Delete
                  </button>
                </div>
                {habit.description ? <p className="mt-3 text-sm text-slate-400">{habit.description}</p> : null}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(habit)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isDone ? 'bg-egyptian-600 text-white hover:bg-egyptian-400' : 'border border-white/15 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {isDone ? 'Done today ✓' : 'Mark done today'}
                  </button>
                  <span className="text-xs text-slate-300">
                    {streakFor(datesByHabit.get(habit.id) || [])} day streak
                  </span>
                </div>
                {habit.pending ? <p className="mt-2 text-[11px] text-egyptian-400">Waiting to sync</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
