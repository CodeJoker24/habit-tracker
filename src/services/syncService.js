import { api } from './api.js';
import {
  deleteOperation,
  deleteRecord,
  getOperation,
  getOperations,
  putOperation,
  putRecord,
  setMeta,
} from './offlineStore.js';

const eventName = 'sync-status';
let flushing = null;
let cleanup = null;

export const collectionFor = (type) => {
  if (type.startsWith('task')) return 'tasks';
  if (type.startsWith('habit')) return type.includes('completion') ? 'completions' : 'habits';
  if (type.startsWith('timer')) return 'sessions';
  return null;
};

const emit = (type, detail = {}) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail: { type, ...detail } }));
};

const endpoint = (operation) => {
  switch (operation.type) {
    case 'task.create': return { method: 'post', url: '/tasks', data: operation.payload, collection: 'tasks' };
    case 'task.update': return { method: 'put', url: `/tasks/${operation.targetId}`, data: operation.payload, collection: 'tasks' };
    case 'task.status': return { method: 'patch', url: `/tasks/${operation.targetId}/status`, data: operation.payload, collection: 'tasks' };
    case 'task.delete': return { method: 'delete', url: `/tasks/${operation.targetId}`, collection: 'tasks', remove: true };
    case 'habit.create': return { method: 'post', url: '/habits', data: operation.payload, collection: 'habits' };
    case 'habit.update': return { method: 'put', url: `/habits/${operation.targetId}`, data: operation.payload, collection: 'habits' };
    case 'habit.delete': return { method: 'delete', url: `/habits/${operation.targetId}`, collection: 'habits', remove: true };
    case 'habit.completion.add':
      return { method: 'post', url: '/habits/completions', data: operation.payload, collection: 'completions', idKey: 'id' };
    case 'habit.completion.remove':
      return {
        method: 'delete',
        url: '/habits/completions',
        data: operation.payload,
        collection: 'completions',
        remove: true,
        idKey: 'id',
      };
    case 'timer.session': return { method: 'post', url: '/timer/sessions', data: operation.payload, collection: 'sessions', idKey: 'id' };
    default: return null;
  }
};

const applyResult = async (operation, config, data) => {
  if (config.remove) {
    await deleteRecord(operation.userId, config.collection, operation.targetId);
    if (operation.localRecord?.id) {
      await deleteRecord(operation.userId, config.collection, operation.localRecord.id);
    }
    return;
  }
  if (operation.type === 'task.create' || operation.type === 'habit.create') {
    await deleteRecord(operation.userId, config.collection, operation.targetId);
  }
  if (data?.id) {
    if (config.collection === 'completions' && operation.targetId !== data.id) {
      await deleteRecord(operation.userId, config.collection, operation.targetId);
    }
    await putRecord(operation.userId, config.collection, data.id, data);
  } else if (data) {
    await putRecord(operation.userId, config.collection, operation.targetId, data);
  }
};

export const enqueue = async (operation) => {
  const queued = {
    operationId: operation.operationId || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    retries: 0,
    nextAttemptAt: 0,
    lastError: null,
    ...operation,
  };
  const collection = collectionFor(queued.type);
  if (queued.localRecord && collection) {
    await putRecord(queued.userId, collection, queued.targetId, queued.localRecord);
  }
  await putOperation(queued);
  emit('queued', { operationId: queued.operationId });
  return queued;
};

export const getQueueStatus = async (userId) => {
  const operations = await getOperations(userId);
  return {
    pending: operations.filter((item) => item.status === 'pending').length,
    conflicts: operations.filter((item) => item.status === 'conflict').length,
    operations,
  };
};

export const flush = async (userId) => {
  if (!userId) return { processed: 0 };
  if (flushing) return flushing;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    emit('offline');
    return { processed: 0 };
  }

  flushing = (async () => {
    const operations = await getOperations(userId);
    const interrupted = operations.filter((operation) => operation.status === 'syncing');
    await Promise.all(interrupted.map((operation) => putOperation({ ...operation, status: 'pending' })));
    interrupted.forEach((operation) => { operation.status = 'pending'; });
    let processed = 0;
    let failed = 0;
    let conflicts = 0;
    const now = Date.now();

    for (const operation of operations) {
      if (operation.status !== 'pending' || operation.nextAttemptAt > now) continue;
      const config = endpoint(operation);
      if (!config) {
        await deleteOperation(operation.operationId);
        continue;
      }

      await putOperation({ ...operation, status: 'syncing' });
      try {
        const headers = { 'X-Operation-Id': operation.operationId };
        if (operation.baseVersion !== undefined) headers['X-Base-Version'] = String(operation.baseVersion);
        const response = await api.request({
          method: config.method,
          url: config.url,
          data: config.data,
          headers,
        });
        await applyResult(operation, config, response.data?.data);
        await deleteOperation(operation.operationId);
        processed += 1;
        emit('confirmed', { operationId: operation.operationId, type: operation.type });
      } catch (error) {
        if (error.status === 409) {
          await putOperation({
            ...operation,
            status: 'conflict',
            serverVersion: error.details?.currentVersion,
            serverUpdatedAt: error.details?.updatedAt,
            lastError: error.message,
          });
          conflicts += 1;
          emit('conflict', { operationId: operation.operationId, message: error.message });
        } else {
          const retries = (operation.retries || 0) + 1;
          await putOperation({
            ...operation,
            status: 'pending',
            retries,
            nextAttemptAt: Date.now() + Math.min(60000, 1000 * 2 ** Math.min(retries, 6)),
            lastError: error.message,
          });
          failed += 1;
        }
      }
    }

    await setMeta('lastSync', new Date().toISOString());
    emit('settled', { processed, failed, conflicts });
    return { processed, failed, conflicts };
  })();

  try {
    return await flushing;
  } finally {
    flushing = null;
  }
};

export const resolveConflict = async (operationId, choice, localData) => {
  const operation = await getOperation(operationId);
  if (!operation || operation.status !== 'conflict') return false;
  const config = endpoint(operation);

  if (choice === 'server') {
    try {
      const response = await api.get(config.url);
      await putRecord(operation.userId, config.collection, response.data.data.id, response.data.data);
      await deleteOperation(operationId);
      emit('confirmed', { operationId, type: operation.type });
      return true;
    } catch {
      return false;
    }
  }

  if (localData) await putRecord(operation.userId, config.collection, operation.targetId, localData);
  await putOperation({
    ...operation,
    status: 'pending',
    baseVersion: operation.serverVersion,
    retries: 0,
    nextAttemptAt: 0,
    lastError: null,
  });
  emit('resolved', { operationId });
  await flush(operation.userId);
  return true;
};

export const discardOperation = async (operationId) => {
  const operation = await getOperation(operationId);
  if (!operation) return;
  await deleteOperation(operationId);
  if (operation.type === 'task.create' || operation.type === 'habit.create') {
    await deleteRecord(operation.userId, operation.type.startsWith('task') ? 'tasks' : 'habits', operation.targetId);
  }
  emit('discarded', { operationId });
};

export const startSyncListener = (userId) => {
  if (cleanup) cleanup();
  if (!userId) return () => null;

  const onOnline = () => flush(userId);
  const onVisible = () => { if (document.visibilityState === 'visible') flush(userId); };
  const onMessage = (event) => {
    if (event.data?.type === 'FLUSH_SYNC') flush(userId);
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  navigator.serviceWorker?.addEventListener('message', onMessage);
  flush(userId);

  cleanup = () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.removeEventListener('message', onMessage);
    cleanup = null;
  };
  return cleanup;
};
