const DB_NAME = 'habit-tracker-offline';
const DB_VERSION = 1;

let databasePromise = null;

const openDatabase = () => {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Offline storage is not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('records')) {
        const records = database.createObjectStore('records', { keyPath: 'key' });
        records.createIndex('userId', 'userId');
        records.createIndex('collection', 'collection');
      }
      if (!database.objectStoreNames.contains('queue')) {
        const queue = database.createObjectStore('queue', { keyPath: 'operationId' });
        queue.createIndex('userId', 'userId');
        queue.createIndex('status', 'status');
      }
      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open offline storage'));
  });
  return databasePromise;
};

const runStore = async (storeName, mode, operation) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('Offline storage error'));
    transaction.onabort = () => reject(transaction.error || new Error('Offline storage error'));
    const request = operation(store);
    if (request) request.onsuccess = () => { result = request.result; };
  });
};

const recordKey = (userId, collection, id) => `${userId}:${collection}:${id}`;

export const putRecord = (userId, collection, id, data) =>
  runStore('records', 'readwrite', (store) =>
    store.put({
      key: recordKey(userId, collection, id),
      userId,
      collection,
      id,
      data,
      updatedAt: Date.now(),
    }),
  );

export const putRecords = async (userId, collection, items, idKey = 'id') => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('records', 'readwrite');
    const store = transaction.objectStore('records');
    items.forEach((item) => {
      store.put({
        key: recordKey(userId, collection, item[idKey]),
        userId,
        collection,
        id: item[idKey],
        data: item,
        updatedAt: Date.now(),
      });
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not cache records'));
  });
};

export const getRecords = async (userId, collection) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const prefix = `${userId}:${collection}:`;
    const range = indexedDBKeyRange(prefix, `${prefix}\uffff`);
    const request = database.transaction('records', 'readonly').objectStore('records').getAll(range);
    request.onsuccess = () => resolve(request.result.map((entry) => entry.data));
    request.onerror = () => reject(request.error || new Error('Could not read cached records'));
  });
};

export const getRecord = (userId, collection, id) =>
  runStore('records', 'readonly', (store) => store.get(recordKey(userId, collection, id)))
    .then((entry) => entry?.data ?? null);

export const deleteRecord = (userId, collection, id) =>
  runStore('records', 'readwrite', (store) => store.delete(recordKey(userId, collection, id)));

export const putOperation = (operation) =>
  runStore('queue', 'readwrite', (store) => store.put(operation));

export const getOperations = async (userId) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction('queue', 'readonly').objectStore('queue').index('userId').getAll(userId);
    request.onsuccess = () => resolve(
      request.result.sort((first, second) => first.createdAt.localeCompare(second.createdAt)),
    );
    request.onerror = () => reject(request.error || new Error('Could not read sync queue'));
  });
};

export const getOperation = (operationId) =>
  runStore('queue', 'readonly', (store) => store.get(operationId));

export const deleteOperation = (operationId) =>
  runStore('queue', 'readwrite', (store) => store.delete(operationId));

export const getMeta = (key) =>
  runStore('meta', 'readonly', (store) => store.get(key)).then((entry) => entry?.value ?? null);

export const setMeta = (key, value) =>
  runStore('meta', 'readwrite', (store) => store.put({ key, value }));

export const clearUserData = async (userId) => {
  const database = await openDatabase();
  await Promise.all(['records', 'queue'].map((name) => new Promise((resolve, reject) => {
    const request = database.transaction(name, 'readwrite').objectStore(name).index('userId').getAllKeys(userId);
    request.onsuccess = () => {
      const transaction = database.transaction(name, 'readwrite');
      const store = transaction.objectStore(name);
      request.result.forEach((key) => store.delete(key));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  })));
};

function indexedDBKeyRange(start, end) {
  return IDBKeyRange.bound(start, end);
}
