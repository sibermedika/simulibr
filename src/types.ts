export type Role = 'SUPER_ADMIN' | 'ADMIN_CLUSTER' | 'TEACHER_CLUSTER' | 'STUDENT_CLUSTER';

export interface Cluster {
  id: string;
  name: string;
  code: string;
  description: string;
  logoUrl?: string;
  subscriptionTier: 'FREE_TRIAL' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  maxSimulators: number;
  maxTeachers: number;
  primaryColor?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  role: Role;
  clusterId?: string;
  clusterCode?: string;
  clusterName?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Simulator {
  id: string;
  title: string;
  slug: string;
  description: string;
  filePath?: string;
  htmlContent: string;
  categoryId: string;
  clusterId?: string;
  clusterName?: string;
  isPublished: boolean;
  viewsCount: number;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FilterState {
  categoryId: string;
  clusterId: string;
  searchQuery: string;
  statusFilter: 'all' | 'published' | 'draft';
}
