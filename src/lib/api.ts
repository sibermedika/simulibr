import { Category, Simulator, User, Cluster } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('eduhub_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('eduhub_jwt_token', token);
  } else {
    localStorage.removeItem('eduhub_jwt_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, add JSON content-type if missing
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }

  return data as T;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const data = await request<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      setAuthToken(null);
      return null;
    }
  },

  logout() {
    setAuthToken(null);
  },

  // Clusters SaaS
  async getClusters(): Promise<Cluster[]> {
    return request<Cluster[]>('/clusters');
  },

  async getClusterById(id: string): Promise<Cluster> {
    return request<Cluster>(`/clusters/${id}`);
  },

  async createCluster(clusterData: any): Promise<{ cluster: Cluster; adminUser: any }> {
    return request<{ cluster: Cluster; adminUser: any }>('/clusters', {
      method: 'POST',
      body: JSON.stringify(clusterData),
    });
  },

  async updateCluster(id: string, updates: Partial<Cluster>): Promise<Cluster> {
    return request<Cluster>(`/clusters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteCluster(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/clusters/${id}`, {
      method: 'DELETE',
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async createUser(userData: any): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Simulators
  async getSimulators(params?: { categoryId?: string; clusterId?: string; search?: string; isPublished?: boolean }): Promise<Simulator[]> {
    const query = new URLSearchParams();
    if (params?.categoryId && params.categoryId !== 'all') query.append('categoryId', params.categoryId);
    if (params?.clusterId && params.clusterId !== 'all') query.append('clusterId', params.clusterId);
    if (params?.search) query.append('search', params.search);
    if (params?.isPublished !== undefined) query.append('isPublished', String(params.isPublished));

    const qs = query.toString();
    return request<Simulator[]>(`/simulators${qs ? `?${qs}` : ''}`);
  },

  async getSimulatorById(id: string): Promise<Simulator> {
    return request<Simulator>(`/simulators/${id}`);
  },

  async createSimulator(formData: FormData): Promise<Simulator> {
    return request<Simulator>('/simulators', {
      method: 'POST',
      body: formData,
    });
  },

  async updateSimulator(id: string, formData: FormData): Promise<Simulator> {
    return request<Simulator>(`/simulators/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteSimulator(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/simulators/${id}`, {
      method: 'DELETE',
    });
  }
};
