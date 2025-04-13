import { users, files, fileVersions, comments, activities, projects, projectMembers, 
  type User, type InsertUser, type File, type InsertFile, 
  type FileVersion, type InsertFileVersion, type Comment, 
  type InsertComment, type Activity, type InsertActivity,
  type Project, type InsertProject, type ProjectMember, type InsertProjectMember } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const MemoryStore = createMemoryStore(session);

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project Members operations
  getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(projectMember: InsertProjectMember): Promise<ProjectMember>;
  
  // File operations
  getFiles(): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]>;
  getRecentFiles(limit?: number): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]>;
  getFile(id: number): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } }) | undefined>;
  createFile(file: InsertFile & { content: Buffer }): Promise<File>;
  
  // File Version operations
  getFileVersions(fileId: number): Promise<(FileVersion & { user: { id: number, name: string, avatarUrl?: string } })[]>;
  createFileVersion(fileVersion: InsertFileVersion & { content: Buffer }): Promise<FileVersion>;
  
  // Comment operations
  getComments(): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string }, fileName: string })[]>;
  getFileComments(fileId: number): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string } })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Activity operations
  getActivities(): Promise<(Activity & { 
    user: { id: number, name: string, avatarUrl?: string },
    fileName?: string
  })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats and contribution operations
  getStats(): Promise<{
    uploads: number;
    comments: number;
    members: number;
    daysActive: number;
    fileTypes: { name: string; value: number }[];
    activityByCategory: { name: string; value: number }[];
  }>;
  
  getContributions(): Promise<{
    userId: number;
    user: { name: string; avatarUrl?: string };
    percentage: number;
    filesCount: number;
    commentsCount: number;
  }[]>;
  
  getActivityByDay(): Promise<{ date: string; files: number; comments: number }[]>;
  
  // Other helper functions
  downloadFile(fileId: number): Promise<{ content: Buffer; fileName: string; contentType: string }>;
  downloadProject(): Promise<Buffer>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private projectsStore: Map<number, Project>;
  private projectMembersStore: Map<number, ProjectMember>;
  private filesStore: Map<number, File>;
  private fileVersionsStore: Map<number, FileVersion>;
  private commentsStore: Map<number, Comment>;
  private activitiesStore: Map<number, Activity>;
  private fileContents: Map<string, Buffer>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private projectMemberIdCounter: number;
  private fileIdCounter: number;
  private fileVersionIdCounter: number;
  private commentIdCounter: number;
  private activityIdCounter: number;
  
  constructor() {
    this.usersStore = new Map();
    this.projectsStore = new Map();
    this.projectMembersStore = new Map();
    this.filesStore = new Map();
    this.fileVersionsStore = new Map();
    this.commentsStore = new Map();
    this.activitiesStore = new Map();
    this.fileContents = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.projectMemberIdCounter = 1;
    this.fileIdCounter = 1;
    this.fileVersionIdCounter = 1;
    this.commentIdCounter = 1;
    this.activityIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create a default project
    this.createProject({
      name: "Web Development Project",
      description: "A collaborative project for web development"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // If no username in the email, generate one
    const email = insertUser.email || `${insertUser.username}@example.com`;
    const avatarUrl = insertUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(insertUser.fullName || insertUser.username)}&background=random`;
    
    const user: User = { 
      ...insertUser, 
      id,
      email,
      avatarUrl,
      createdAt: new Date().toISOString() 
    };
    
    this.usersStore.set(id, user);
    
    // Add user to default project
    if (this.projectsStore.size > 0) {
      const projectId = 1; // First project
      await this.addProjectMember({
        userId: id,
        projectId,
        role: "member",
        joinedAt: new Date().toISOString()
      });
      
      // Create "join" activity
      await this.createActivity({
        type: "join",
        userId: id,
        projectId,
        timestamp: new Date().toISOString()
      });
    }
    
    return user;
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projectsStore.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsStore.get(id);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date().toISOString()
    };
    
    this.projectsStore.set(id, newProject);
    return newProject;
  }
  
  // Project Members operations
  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    return Array.from(this.projectMembersStore.values())
      .filter(member => member.projectId === projectId)
      .map(member => {
        const user = this.usersStore.get(member.userId);
        return {
          ...member,
          user: user as User
        };
      });
  }
  
  async addProjectMember(projectMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.projectMemberIdCounter++;
    const newMember: ProjectMember = {
      ...projectMember,
      id
    };
    
    this.projectMembersStore.set(id, newMember);
    return newMember;
  }
  
  // File operations
  async getFiles(): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    return Array.from(this.filesStore.values()).map(file => {
      const user = this.usersStore.get(file.userId);
      return {
        ...file,
        user: {
          id: user?.id || 0,
          name: user?.fullName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl
        }
      };
    });
  }
  
  async getRecentFiles(limit: number = 4): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const files = await this.getFiles();
    // Sort by updatedAt descending
    return files.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, limit);
  }
  
  async getFile(id: number): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } }) | undefined> {
    const file = this.filesStore.get(id);
    if (!file) return undefined;
    
    const user = this.usersStore.get(file.userId);
    return {
      ...file,
      user: {
        id: user?.id || 0,
        name: user?.fullName || user?.username || "Unknown",
        avatarUrl: user?.avatarUrl
      }
    };
  }
  
  async createFile(fileData: InsertFile & { content: Buffer }): Promise<File> {
    const id = this.fileIdCounter++;
    const { content, ...fileInfo } = fileData;
    
    // Generate a unique file path
    const fileName = `file_${id}_${Date.now()}_${randomUUID()}`;
    const filePath = fileName;
    
    // Store the file content
    this.fileContents.set(filePath, content);
    
    const file: File = {
      ...fileInfo,
      id,
      path: filePath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.filesStore.set(id, file);
    
    // Create an initial file version
    await this.createFileVersion({
      fileId: id,
      version: 1,
      path: filePath,
      size: fileInfo.size,
      userId: fileInfo.userId,
      action: "uploaded",
      createdAt: new Date().toISOString(),
      content
    });
    
    // Create an activity
    await this.createActivity({
      type: "upload",
      userId: fileInfo.userId,
      fileId: id,
      projectId: fileInfo.projectId,
      timestamp: new Date().toISOString()
    });
    
    return file;
  }
  
  // File Version operations
  async getFileVersions(fileId: number): Promise<(FileVersion & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const versions = Array.from(this.fileVersionsStore.values())
      .filter(version => version.fileId === fileId)
      .sort((a, b) => b.version - a.version); // Sort by version descending
    
    return versions.map(version => {
      const user = this.usersStore.get(version.userId);
      return {
        ...version,
        user: {
          id: user?.id || 0,
          name: user?.fullName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl
        }
      };
    });
  }
  
  async createFileVersion(fileVersion: InsertFileVersion & { content: Buffer }): Promise<FileVersion> {
    const id = this.fileVersionIdCounter++;
    const { content, ...versionInfo } = fileVersion;
    
    // Store file content
    this.fileContents.set(versionInfo.path, content);
    
    const version: FileVersion = {
      ...versionInfo,
      id
    };
    
    this.fileVersionsStore.set(id, version);
    
    // Update the file's updatedAt
    const file = this.filesStore.get(fileVersion.fileId);
    if (file) {
      this.filesStore.set(file.id, {
        ...file,
        updatedAt: new Date().toISOString()
      });
      
      // Create an activity if this is not the first version
      if (fileVersion.version > 1) {
        await this.createActivity({
          type: "update",
          userId: fileVersion.userId,
          fileId: fileVersion.fileId,
          projectId: file.projectId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return version;
  }
  
  // Comment operations
  async getComments(): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string }, fileName: string })[]> {
    return Array.from(this.commentsStore.values()).map(comment => {
      const user = this.usersStore.get(comment.userId);
      const file = this.filesStore.get(comment.fileId);
      
      return {
        ...comment,
        user: {
          id: user?.id || 0,
          name: user?.fullName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl
        },
        fileName: file?.name || "Unknown File"
      };
    });
  }
  
  async getFileComments(fileId: number): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const comments = Array.from(this.commentsStore.values())
      .filter(comment => comment.fileId === fileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return comments.map(comment => {
      const user = this.usersStore.get(comment.userId);
      return {
        ...comment,
        user: {
          id: user?.id || 0,
          name: user?.fullName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl
        }
      };
    });
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date().toISOString()
    };
    
    this.commentsStore.set(id, newComment);
    
    // Create an activity
    const file = await this.getFile(comment.fileId);
    if (file) {
      await this.createActivity({
        type: "comment",
        userId: comment.userId,
        fileId: comment.fileId,
        projectId: file.projectId,
        timestamp: new Date().toISOString()
      });
    }
    
    return newComment;
  }
  
  // Activity operations
  async getActivities(): Promise<(Activity & { 
    user: { id: number, name: string, avatarUrl?: string },
    fileName?: string
  })[]> {
    const activities = Array.from(this.activitiesStore.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return activities.map(activity => {
      const user = this.usersStore.get(activity.userId);
      const file = activity.fileId ? this.filesStore.get(activity.fileId) : undefined;
      
      return {
        ...activity,
        user: {
          id: user?.id || 0,
          name: user?.fullName || user?.username || "Unknown",
          avatarUrl: user?.avatarUrl
        },
        fileName: file?.name
      };
    });
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const newActivity: Activity = {
      ...activity,
      id
    };
    
    this.activitiesStore.set(id, newActivity);
    return newActivity;
  }
  
  // Stats and contribution operations
  async getStats(): Promise<{
    uploads: number;
    comments: number;
    members: number;
    daysActive: number;
    fileTypes: { name: string; value: number }[];
    activityByCategory: { name: string; value: number }[];
  }> {
    const uploads = this.filesStore.size;
    const comments = this.commentsStore.size;
    const members = this.usersStore.size;
    
    // Calculate days active
    const activityDates = new Set<string>();
    Array.from(this.activitiesStore.values()).forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      activityDates.add(date);
    });
    const daysActive = activityDates.size;
    
    // Calculate file types
    const fileTypeCounts: Record<string, number> = {};
    Array.from(this.filesStore.values()).forEach(file => {
      const fileType = file.type;
      fileTypeCounts[fileType] = (fileTypeCounts[fileType] || 0) + 1;
    });
    
    const fileTypes = Object.entries(fileTypeCounts).map(([name, value]) => ({ name, value }));
    
    // Calculate activity by category
    const uploads2 = this.activitiesStore.size;
    const updates = Array.from(this.activitiesStore.values()).filter(a => a.type === "update").length;
    const commentActivity = Array.from(this.activitiesStore.values()).filter(a => a.type === "comment").length;
    
    const activityByCategory = [
      { name: "Uploads", value: uploads },
      { name: "Updates", value: updates },
      { name: "Comments", value: commentActivity }
    ];
    
    return {
      uploads,
      comments,
      members,
      daysActive: daysActive || 1, // Ensure at least 1 day
      fileTypes,
      activityByCategory
    };
  }
  
  async getContributions(): Promise<{
    userId: number;
    user: { name: string; avatarUrl?: string };
    percentage: number;
    filesCount: number;
    commentsCount: number;
  }[]> {
    const users = Array.from(this.usersStore.values());
    const userContributions: Record<number, { filesCount: number; commentsCount: number }> = {};
    
    // Initialize with zeros
    users.forEach(user => {
      userContributions[user.id] = { filesCount: 0, commentsCount: 0 };
    });
    
    // Count files per user
    Array.from(this.filesStore.values()).forEach(file => {
      if (userContributions[file.userId]) {
        userContributions[file.userId].filesCount++;
      }
    });
    
    // Count comments per user
    Array.from(this.commentsStore.values()).forEach(comment => {
      if (userContributions[comment.userId]) {
        userContributions[comment.userId].commentsCount++;
      }
    });
    
    // Calculate total contribution score (files count more than comments)
    const contributionScores = users.map(user => {
      const { filesCount, commentsCount } = userContributions[user.id];
      // Weight: files are worth 3 points, comments are worth 1 point
      const score = filesCount * 3 + commentsCount;
      return {
        userId: user.id,
        user: {
          name: user.fullName || user.username,
          avatarUrl: user.avatarUrl
        },
        score,
        filesCount,
        commentsCount
      };
    });
    
    // Calculate percentages
    const totalScore = contributionScores.reduce((sum, item) => sum + item.score, 0);
    
    return contributionScores.map(item => ({
      ...item,
      percentage: totalScore > 0 ? Math.round((item.score / totalScore) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage);
  }
  
  async getActivityByDay(): Promise<{ date: string; files: number; comments: number }[]> {
    const activities = Array.from(this.activitiesStore.values());
    const activityByDay: Record<string, { files: number; comments: number }> = {};
    
    // Get the date range (last 14 days)
    const today = new Date();
    const dates: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dates.push(dateString);
      activityByDay[dateString] = { files: 0, comments: 0 };
    }
    
    // Count activities by date
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (activityByDay[date]) {
        if (activity.type === 'upload' || activity.type === 'update') {
          activityByDay[date].files++;
        } else if (activity.type === 'comment') {
          activityByDay[date].comments++;
        }
      }
    });
    
    // Convert to array
    return dates.map(date => ({
      date,
      files: activityByDay[date]?.files || 0,
      comments: activityByDay[date]?.comments || 0
    }));
  }
  
  // File download operations
  async downloadFile(fileId: number): Promise<{ content: Buffer; fileName: string; contentType: string }> {
    const file = await this.getFile(fileId);
    if (!file) throw new Error("File not found");
    
    const content = this.fileContents.get(file.path);
    if (!content) throw new Error("File content not found");
    
    // Determine content type based on file extension
    let contentType = "application/octet-stream"; // Default
    const extension = path.extname(file.name).toLowerCase();
    
    switch (extension) {
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
      case '.docx':
        contentType = 'application/msword';
        break;
      case '.xls':
      case '.xlsx':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.zip':
        contentType = 'application/zip';
        break;
    }
    
    return {
      content,
      fileName: file.name,
      contentType
    };
  }
  
  async downloadProject(): Promise<Buffer> {
    // In a real implementation, this would zip all project files
    // For this in-memory implementation, we'll just create a simple text file
    // listing all files in the project
    
    const filesList = Array.from(this.filesStore.values())
      .map(file => `${file.name} (${file.size} bytes) - Uploaded by user #${file.userId} on ${file.createdAt}`)
      .join('\n');
    
    const content = `GroupHub Project Files\n\n${filesList}`;
    return Buffer.from(content);
  }
}

export const storage = new MemStorage();
