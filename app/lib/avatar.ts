type AvatarResult = { success: boolean; data?: string | null; error?: string };

const cache = new Map<string, Promise<AvatarResult>>();

export function fetchAvatar(param: string, endpoint: string, searchParam: string): Promise<AvatarResult> {
  if (!param) return Promise.resolve({ success: true, data: null });
  if (cache.has(param)) return cache.get(param)!;

  const promise = fetch(`/api/avatar/${endpoint}?${searchParam}=${param}`, {
    credentials: 'omit',
  })
    .then(res => {
      if (res.status === 404) return { success: true, data: null } as AvatarResult;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .catch(err => ({ success: false, error: err.message }));

  cache.set(param, promise);
  return promise;
}