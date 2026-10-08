export async function workspaceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  let data: (T & { error?: string }) | undefined;
  try {
    const text = await response.text();
    data = text ? (JSON.parse(text) as T & { error?: string }) : undefined;
  } catch {
    data = undefined;
  }
  if (!response.ok) throw new Error(data?.error ?? (response.statusText || `Request failed with status ${response.status}`));
  return (data ?? {} as T) as T;
}
