import { requestBackgroundSync } from './pwa.js';
import { enqueue } from './syncService.js';

export const performMutation = async ({ operation, apply, revert, request }) => {
  const operationId = crypto.randomUUID();
  const headers = { 'X-Operation-Id': operationId };
  if (operation.baseVersion !== undefined) headers['X-Base-Version'] = String(operation.baseVersion);

  apply();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    await enqueue({ ...operation, operationId });
    requestBackgroundSync();
    return true;
  }

  try {
    await request(headers);
    return true;
  } catch (error) {
    if (!error.status || error.status >= 500) {
      await enqueue({ ...operation, operationId });
      requestBackgroundSync();
      return true;
    }
    revert();
    throw error;
  }
};
