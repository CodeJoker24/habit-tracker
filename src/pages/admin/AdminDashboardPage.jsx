import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Icon from '../../components/Icon.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import PageHeading from '../../components/PageHeading.jsx';
import { deleteUserAccount, getAdminSummary, getDeletionRequests } from '../../services/admin.js';

export default function AdminDashboardPage({ embedded = false }) {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextRequests] = await Promise.all([getAdminSummary(), getDeletionRequests()]);
      setSummary(nextSummary);
      setRequests(nextRequests);
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (request) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this account?',
      text: `${request.full_name || request.email} and all of their data will be permanently removed.`,
      showCancelButton: true,
      confirmButtonText: 'Delete permanently',
      confirmButtonColor: '#c62f3c',
    });
    if (!result.isConfirmed) return;

    setBusyId(request.id);
    try {
      await deleteUserAccount(request.id);
      await load();
      Swal.fire({ icon: 'success', title: 'Account deleted', timer: 1500, showConfirmButton: false });
    } catch (requestError) {
      Swal.fire({ icon: 'error', title: 'Could not delete account', text: requestError.message });
    } finally {
      setBusyId(null);
    }
  };

  if (!summary && !error) return <LoadingScreen />;

  const cards = summary
    ? [
        { label: 'Total users', value: summary.totalUsers, icon: 'user' },
        { label: 'Active users', value: summary.activeUsers, icon: 'spark' },
        { label: 'Administrators', value: summary.admins, icon: 'shield' },
      ]
    : [];

  return (
    <div className="space-y-8">
      {!embedded ? (
        <PageHeading
          eyebrow="Administration"
          title="Platform overview"
          description="Server-side counts from the protected admin RPC."
        />
      ) : null}

      {error ? (
        <div className="rounded-xl border border-scarlet-600/40 bg-scarlet-600/10 p-5 text-sm text-scarlet-200">
          {error}. Apply the database migrations in <code>backend/supabase/migrations</code> to enable admin data.
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-egyptian-400/30 bg-gradient-to-br from-egyptian-600/40 to-slate-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-slate-300">{card.label}</p>
                <Icon name={card.icon} size={18} className="text-slate-300" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{card.value ?? 0}</p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Account deletion</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Deletion requests</h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{requests.length} pending</span>
        </div>

        {requests.length === 0 ? (
          <p className="mt-5 text-sm text-slate-400">No accounts have requested deletion.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-scarlet-600/20 text-scarlet-200">
                  <Icon name="user" size={18} />
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-medium text-white">{request.full_name || request.email}</p>
                  <p className="text-[11px] text-slate-400">
                    {request.email} · requested {new Date(request.account_deletion_requested_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => handleDelete(request)}
                  className="rounded-lg bg-scarlet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-scarlet-500 disabled:opacity-60"
                >
                  {busyId === request.id ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {!embedded ? <Link to="/dashboard" className="inline-flex text-sm text-slate-300 hover:text-white">← Back to dashboard</Link> : null}
    </div>
  );
}
