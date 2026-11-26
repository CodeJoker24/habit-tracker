import { useCallback, useEffect, useState } from 'react';
import { getRecord } from '../services/offlineStore.js';
import { discardOperation, getQueueStatus, resolveConflict } from '../services/syncService.js';

const collectionFor = (type) => (type.startsWith('task') ? 'tasks' : type.startsWith('habit') ? 'habits' : null);

export default function SyncStatus({ userId }) {
  const [status, setStatus] = useState({ pending: 0, conflicts: 0, operations: [] });
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setStatus(await getQueueStatus(userId));
    } catch {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    load();
    const onEvent = () => load();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('sync-status', onEvent);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('sync-status', onEvent);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [load]);

  const decide = async (operation, choice) => {
    setBusy(true);
    try {
      if (choice === 'discard') await discardOperation(operation.operationId);
      else {
        const collection = collectionFor(operation.type);
        const localData = collection ? await getRecord(userId, collection, operation.targetId) : null;
        await resolveConflict(operation.operationId, choice, localData);
      }
    } finally {
      setBusy(false);
      load();
    }
  };

  const conflict = status.operations.find((operation) => operation.status === 'conflict');
  if (online && !status.pending && !status.conflicts) return null;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/15 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        {!online ? 'Offline — changes are saved on this device' : `${status.pending} change${status.pending === 1 ? '' : 's'} waiting to sync`}
      </div>
      {conflict ? (
        <div className="rounded-xl border border-egyptian-400/40 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold text-white">A change needs your decision</p>
          <p className="mt-1 text-xs text-slate-300">{conflict.lastError || 'This item changed on another device.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(conflict, 'server')}
              className="rounded-lg bg-egyptian-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Use server version
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(conflict, 'mine')}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-60"
            >
              Keep mine
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(conflict, 'discard')}
              className="rounded-lg px-3 py-1.5 text-xs text-scarlet-200 hover:bg-scarlet-600/20 disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
