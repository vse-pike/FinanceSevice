export async function httpGetJson<T>(
  url: string,
  opts?: { headers?: Record<string, string>; timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 10_000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: opts?.headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await safeText(res);
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${body?.slice(0, 200) ?? ''}`);
    }

    const json = await res.json();
    return json as T;
  } finally {
    clearTimeout(t);
  }
}

async function safeText(res: Response): Promise<string | null> {
  try {
    return await res.text();
  } catch {
    return null;
  }
}
