import {
  User, SkillTree, TreeData, SkillNode, Activity, Stats,
  ObsidianNote, GraphData
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

class ApiError extends Error {
  status: number;
  detail: any;
  constructor(message: string, status: number, detail?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function resolveUrl(path: string): string {
  if (API_BASE) return `${API_BASE}${path}`;
  if (typeof window === 'undefined') return `http://localhost:8002${path}`;
  // Detect subpath (e.g., /forge) from current URL so API calls work
  // whether served from root or behind a reverse proxy path.
  const pathname = window.location.pathname;
  const baseMatch = pathname.match(/^\/(tree|activities|obsidian|login)/);
  if (!baseMatch) {
    // We might be under a subpath like /forge/
    const segment = pathname.split('/').filter(Boolean)[0];
    if (segment && !['tree', 'activities', 'obsidian', 'login'].includes(segment)) {
      return `${window.location.origin}/${segment}${path}`;
    }
  }
  return `${window.location.origin}${path}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = resolveUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // In production, you'd read from localStorage or cookie
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('forge_api_key') : null;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let detail;
      try { detail = await res.json(); } catch {}
      throw new ApiError(detail?.message || `HTTP ${res.status}`, res.status, detail);
    }
    if (res.status === 204) return undefined as T;
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  }
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Users
  createUser: (username: string, displayName?: string) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, display_name: displayName }),
    }),
  me: () => request<User>('/api/users/me'),

  // Trees
  listTrees: () => request<SkillTree[]>('/api/trees'),
  getTree: (id: number) => request<TreeData>(`/api/trees/${id}`),
  createTree: (data: Partial<SkillTree>) =>
    request<SkillTree>('/api/trees', { method: 'POST', body: JSON.stringify(data) }),
  cloneTree: (id: number) =>
    request<{ tree_id: number; message: string }>(`/api/trees/${id}/clone`, { method: 'POST' }),
  initProgress: (id: number) =>
    request<{ message: string }>(`/api/trees/${id}/init`, { method: 'POST' }),

  // Skills
  listSkills: (treeId: number) => request<SkillNode[]>(`/api/skills/tree/${treeId}`),

  // Activities
  logActivity: (skillId: number, description: string, xp: number, source = 'web') =>
    request<any>('/api/activities', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId, description, xp_amount: xp, source }),
    }),
  listActivities: (params?: { skill_id?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return request<Activity[]>(`/api/activities${qs}`);
  },

  // Stats
  getStats: () => request<Stats>('/api/stats'),

  // Obsidian
  listNotes: () => request<ObsidianNote[]>('/api/obsidian/notes'),
  syncVault: (vaultPath?: string) =>
    request<{ message: string; count: number }>('/api/obsidian/sync', {
      method: 'POST',
      body: JSON.stringify({ vault_path: vaultPath }),
    }),
  getGraph: () => request<GraphData>('/api/obsidian/graph'),
};

export { ApiError };
