export interface User {
  id: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  password: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface StatsData {
  uploads: number;
  comments: number;
  members: number;
  daysActive: number;
  fileTypes: { name: string; value: number }[];
  activityByCategory: { name: string; value: number }[];
}

export interface UserType {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  stats: {
    files: number;
    comments: number;
    filesPercentage: number;
    commentsPercentage: number;
    contributionPercentage: number;
  };
}

export interface UserContribution {
  userId: number;
  user: {
    name: string;
    avatarUrl?: string;
  };
  percentage: number;
  filesCount: number;
  commentsCount: number;
}

export interface FileType {
  id: number;
  name: string;
  type: string;
  size: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  fileId: number;
  fileName: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface FileVersion {
  id: number;
  fileId: number;
  version: number;
  createdAt: string;
  action: string;
  notes?: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface Activity {
  id: number;
  type: 'upload' | 'comment' | 'update' | 'join';
  timestamp: string;
  fileId?: number;
  fileName?: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface ActivityByDay {
  date: string;
  files: number;
  comments: number;
}
