import func2url from "../../backend/func2url.json";

const URLS = func2url as Record<string, string>;

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function request<T = unknown>(
  fn: keyof typeof URLS,
  path: string,
  options: RequestInit = {},
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(URLS[fn]);
  if (path && path !== "/") {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    url.searchParams.set("action", cleanPath);
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["X-Auth-Token"] = token;

  const res = await fetch(url.toString(), { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // Auth
  register: (body: object) =>
    request("auth", "/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: object) =>
    request("auth", "/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () =>
    request("auth", "/logout", { method: "POST" }),
  me: () => request("auth", "/me", { method: "GET" }),
  updateMe: (body: object) =>
    request("auth", "/me", { method: "PUT", body: JSON.stringify(body) }),
  forgotPassword: (email: string) =>
    request("auth", "/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request("auth", "/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  // Animals
  getAnimals: (params?: Record<string, string>) => {
    const url = new URL(URLS.animals);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["X-Auth-Token"] = token;
    return fetch(url.toString(), { headers }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      return d;
    });
  },
  getAnimal: (id: number) => {
    const url = new URL(URLS.animals);
    url.searchParams.set("action", "get");
    url.searchParams.set("id", String(id));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["X-Auth-Token"] = token;
    return fetch(url.toString(), { headers }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      return d;
    });
  },
  getMyAnimals: () => {
    const url = new URL(URLS.animals);
    url.searchParams.set("action", "my");
    const token = getToken();
    const headers: Record<string, string> = { "X-Auth-Token": token || "" };
    return fetch(url.toString(), { headers }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      return d;
    });
  },
  createAnimal: (body: object) =>
    request("animals", "/", { method: "POST", body: JSON.stringify(body) }),
  updateAnimal: (id: number, body: object) =>
    request("animals", `/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Social - Favorites
  getFavorites: () => socialGet("favorites"),
  addFavorite: (animal_id: number) => socialPost(`favorites/${animal_id}`),
  removeFavorite: (animal_id: number) => socialDelete(`favorites/${animal_id}`),

  // Social - Messages
  getConversations: () => socialGet("conversations"),
  getMessages: (conv_id: number) => socialGet(`conversations/${conv_id}`),
  sendMessage: (body: object) => socialPost("send", body),

  // Social - Notifications
  getNotifications: () => socialGet("notifications"),
  getUnreadCount: () => socialGet("notifications/unread-count"),
  readAll: () => socialPostEmpty("notifications/read-all"),

  // Shelters
  getShelters: (params?: Record<string, string>) => {
    const url = new URL(URLS.shelters);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return fetch(url.toString()).then(async (r) => r.json());
  },
  getShelter: (id: number) => {
    const url = new URL(URLS.shelters);
    url.searchParams.set("action", "get");
    url.searchParams.set("id", String(id));
    return fetch(url.toString()).then(async (r) => r.json());
  },
  createShelter: (body: object) =>
    request("shelters", "/", { method: "POST", body: JSON.stringify(body) }),
  updateShelter: (id: number, body: object) =>
    request("shelters", `/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Admin
  adminStats: () => {
    const url = new URL(URLS.admin);
    url.searchParams.set("action", "stats");
    const token = getToken();
    const headers: Record<string, string> = { "X-Auth-Token": token || "" };
    return fetch(url.toString(), { headers }).then(async (r) => r.json());
  },
  adminGetAnimals: (params?: Record<string, string>) => {
    const url = new URL(URLS.admin);
    url.searchParams.set("action", "animals");
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const token = getToken();
    const headers: Record<string, string> = { "X-Auth-Token": token || "" };
    return fetch(url.toString(), { headers }).then(async (r) => r.json());
  },
  adminApprove: (id: number) =>
    request("admin", `/animals/${id}/approve`, { method: "PUT" }),
  adminReject: (id: number, reason?: string) =>
    request("admin", `/animals/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),
  adminGetUsers: (params?: Record<string, string>) => {
    const url = new URL(URLS.admin);
    url.searchParams.set("action", "users");
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const token = getToken();
    const headers: Record<string, string> = { "X-Auth-Token": token || "" };
    return fetch(url.toString(), { headers }).then(async (r) => r.json());
  },
};

function socialGet(section: string) {
  const url = new URL(URLS.social);
  url.searchParams.set("section", section);
  const token = getToken();
  const headers: Record<string, string> = { "X-Auth-Token": token || "" };
  return fetch(url.toString(), { headers }).then(async (r) => {
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
    return d;
  });
}

function socialPost(section: string, body?: object) {
  const url = new URL(URLS.social);
  url.searchParams.set("section", section);
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Auth-Token": token || "",
  };
  return fetch(url.toString(), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
    return d;
  });
}

function socialDelete(section: string) {
  const url = new URL(URLS.social);
  url.searchParams.set("section", section);
  const token = getToken();
  const headers: Record<string, string> = { "X-Auth-Token": token || "" };
  return fetch(url.toString(), { method: "DELETE", headers }).then(async (r) => {
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
    return d;
  });
}

function socialPostEmpty(section: string) {
  return socialPost(section, {});
}
