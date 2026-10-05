export async function workspaceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const data = await response.json() as T & {error?:string};
  if (!response.ok) throw new Error(data.error ?? "Could not complete the request.");
  return data;
}
