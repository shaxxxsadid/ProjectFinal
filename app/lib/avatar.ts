type AvatarResult = { success: boolean; data?: string | null; error?: string };

const cache = new Map<string, Promise<AvatarResult>>();

export function fetchAvatar(
  param: string,
  endpoint: string,
  searchParam: string,
  version?: number
): Promise<AvatarResult> {
  if (!param) return Promise.resolve({ success: true, data: null });

  const key = `${endpoint}?${searchParam}=${param}:${version ?? 0}`;

  // Если версия > 0 — чистим все старые записи для этого param
  if (version && version > 0) {
    for (const cachedKey of cache.keys()) {
      if (cachedKey.startsWith(`${endpoint}?${searchParam}=${param}:`)) {
        cache.delete(cachedKey);
      }
    }
  }

  if (cache.has(key)) return cache.get(key)!;

  const url = `/api/avatar/${endpoint}?${searchParam}=${encodeURIComponent(param)}&v=${version ?? 0}`;

  const promise = fetch(url, { credentials: 'omit' })
    .then(res => {
      if (res.status === 404) return { success: true, data: null } as AvatarResult;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .catch(err => ({ success: false, error: err.message }));

  cache.set(key, promise);
  return promise;
}