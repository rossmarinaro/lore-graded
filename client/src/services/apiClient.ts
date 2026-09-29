/** Explicit opt-in only. The review app never constructs this client automatically. */
export interface ApiClientConfiguration {
  apiOrigin: string;
  getAccessToken: () => Promise<string | null>;
}
export class LoreApiClient {
  constructor(private readonly configuration: ApiClientConfiguration) {
    if (!/^https:\/\//.test(configuration.apiOrigin))
      throw Error("A secure API origin is required.");
  }
  async request<ResponseBody>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      signal?: AbortSignal;
    } = {},
  ): Promise<ResponseBody> {
    if (!path.startsWith("/api/")) throw Error("Expected an API path.");
    const token = await this.configuration.getAccessToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    const response = await fetch(this.configuration.apiOrigin + path, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
    if (!response.ok) throw Error(`LORE service returned ${response.status}.`);
    return (await response.json()) as ResponseBody;
  }
}
// Native authentication needs its own approved token flow. Browser cookies are not native credentials.
