import { 
  users, files, fileVersions, comments, activities, projects, projectMembers,
  type User, type File, type FileVersion, type Comment, type Activity, type Project, type ProjectMember,
  type InsertUser, type InsertFile, type InsertFileVersion, type InsertComment, type InsertActivity, type InsertProject, type InsertProjectMember
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  // Project Members operations
  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    
    // Fetch the user data for each member
    const result = await Promise.all(
      members.map(async (member) => {
        const user = await this.getUser(member.userId);
        return { ...member, user: user! };
      })
    );
    
    return result;
  }

  async addProjectMember(projectMember: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db
      .insert(projectMembers)
      .values(projectMember)
      .returning();
    return newMember;
  }

  // File operations
  async getFiles(): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const filesList = await db
      .select()
      .from(files)
      .orderBy(desc(files.createdAt));
    
    // Fetch the user data for each file
    const result = await Promise.all(
      filesList.map(async (file) => {
        const user = await this.getUser(file.userId);
        return { 
          ...file, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          }
        };
      })
    );
    
    return result;
  }

  async getRecentFiles(limit: number = 4): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const filesList = await db
      .select()
      .from(files)
      .orderBy(desc(files.createdAt))
      .limit(limit);
    
    // Fetch the user data for each file
    const result = await Promise.all(
      filesList.map(async (file) => {
        const user = await this.getUser(file.userId);
        return { 
          ...file, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          }
        };
      })
    );
    
    return result;
  }

  async getFile(id: number): Promise<(File & { user: { id: number, name: string, avatarUrl?: string } }) | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));
    
    if (!file) return undefined;
    
    const user = await this.getUser(file.userId);
    
    return { 
      ...file, 
      user: {
        id: user!.id,
        name: user!.fullName || user!.username,
        avatarUrl: user!.avatarUrl
      }
    };
  }

  async createFile(fileData: InsertFile & { content: Buffer }): Promise<File> {
    // Store the file content in the file system or a separate blob store
    // For this implementation, we'll just generate a path
    const fileName = `${Date.now()}-${fileData.name}`;
    const filePath = `uploads/${fileName}`;

    // Store the file in the filesystem
    const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, fileName), fileData.content);
    
    // Create the file record in the database
    const [file] = await db
      .insert(files)
      .values({
        ...fileData,
        path: filePath
      })
      .returning();
    
    // Create an activity record
    await this.createActivity({
      type: "upload",
      userId: fileData.userId,
      fileId: file.id,
      projectId: fileData.projectId
    });
    
    return file;
  }

  // File Version operations
  async getFileVersions(fileId: number): Promise<(FileVersion & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const versionsList = await db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId))
      .orderBy(desc(fileVersions.version));
    
    // Fetch the user data for each version
    const result = await Promise.all(
      versionsList.map(async (version) => {
        const user = await this.getUser(version.userId);
        return { 
          ...version, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          }
        };
      })
    );
    
    return result;
  }

  async createFileVersion(fileVersion: InsertFileVersion & { content: Buffer }): Promise<FileVersion> {
    // Store the file content in the file system or a separate blob store
    const file = await this.getFile(fileVersion.fileId);
    const fileName = `${Date.now()}-v${fileVersion.version}-${file!.name}`;
    const filePath = `uploads/versions/${fileName}`;

    // Store the file in the filesystem
    const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads/versions");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, fileName), fileVersion.content);
    
    // Create the file version record in the database
    const [version] = await db
      .insert(fileVersions)
      .values({
        ...fileVersion,
        path: filePath
      })
      .returning();
    
    // Create an activity record
    await this.createActivity({
      type: "update",
      userId: fileVersion.userId,
      fileId: fileVersion.fileId,
      projectId: file!.projectId
    });
    
    return version;
  }

  // Comment operations
  async getComments(): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string }, fileName: string })[]> {
    const commentsList = await db
      .select()
      .from(comments)
      .orderBy(desc(comments.createdAt));
    
    // Fetch the user data and file name for each comment
    const result = await Promise.all(
      commentsList.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        const file = await this.getFile(comment.fileId);
        return { 
          ...comment, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          },
          fileName: file!.name
        };
      })
    );
    
    return result;
  }

  async getFileComments(fileId: number): Promise<(Comment & { user: { id: number, name: string, avatarUrl?: string } })[]> {
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.fileId, fileId))
      .orderBy(desc(comments.createdAt));
    
    // Fetch the user data for each comment
    const result = await Promise.all(
      commentsList.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        return { 
          ...comment, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          }
        };
      })
    );
    
    return result;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    // Create the comment record in the database
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    
    // Get the file to get the project ID
    const file = await this.getFile(comment.fileId);
    
    // Create an activity record
    await this.createActivity({
      type: "comment",
      userId: comment.userId,
      fileId: comment.fileId,
      projectId: file!.projectId
    });
    
    return newComment;
  }

  // Activity operations
  async getActivities(): Promise<(Activity & { 
    user: { id: number, name: string, avatarUrl?: string },
    fileName?: string
  })[]> {
    const activitiesList = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(50);
    
    // Fetch the user data and file name for each activity
    const result = await Promise.all(
      activitiesList.map(async (activity) => {
        const user = await this.getUser(activity.userId);
        
        let fileName;
        if (activity.fileId) {
          const file = await this.getFile(activity.fileId);
          fileName = file?.name;
        }
        
        return { 
          ...activity, 
          user: {
            id: user!.id,
            name: user!.fullName || user!.username,
            avatarUrl: user!.avatarUrl
          },
          fileName
        };
      })
    );
    
    return result;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    // Create the activity record in the database
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    
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
    // Count uploads (files)
    const [filesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files);
    const uploads = filesResult.count;
    
    // Count comments
    const [commentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments);
    const commentsCount = commentsResult.count;
    
    // Count members (project members)
    const [membersResult] = await db
      .select({ count: sql<number>`count(distinct ${projectMembers.userId})` })
      .from(projectMembers);
    const members = membersResult.count;
    
    // Count days active
    const [daysActiveResult] = await db
      .select({ count: sql<number>`count(distinct date(${activities.timestamp}))` })
      .from(activities);
    const daysActive = daysActiveResult.count;
    
    // Count files by type
    const fileTypesResult = await db
      .select({
        name: files.type,
        value: sql<number>`count(*)`
      })
      .from(files)
      .groupBy(files.type);
    
    // Count activities by type
    const activityByCategoryResult = await db
      .select({
        name: activities.type,
        value: sql<number>`count(*)`
      })
      .from(activities)
      .groupBy(activities.type);
    
    return {
      uploads,
      comments: commentsCount,
      members,
      daysActive,
      fileTypes: fileTypesResult,
      activityByCategory: activityByCategoryResult
    };
  }
  
  async getContributions(): Promise<{
    userId: number;
    user: { name: string; avatarUrl?: string };
    percentage: number;
    filesCount: number;
    commentsCount: number;
  }[]> {
    // Get users
    const usersList = await db.select().from(users);
    
    // Get counts of files and comments by each user
    const result = await Promise.all(
      usersList.map(async (user) => {
        // Count files uploaded by user
        const [filesResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(files)
          .where(eq(files.userId, user.id));
        const filesCount = filesResult.count;
        
        // Count comments by user
        const [commentsResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.userId, user.id));
        const commentsCount = commentsResult.count;
        
        return {
          userId: user.id,
          user: {
            name: user.fullName || user.username,
            avatarUrl: user.avatarUrl
          },
          filesCount,
          commentsCount
        };
      })
    );
    
    // Calculate total counts
    const totalFiles = result.reduce((sum, item) => sum + item.filesCount, 0);
    const totalComments = result.reduce((sum, item) => sum + item.commentsCount, 0);
    
    // Calculate percentage contribution for each user
    const resultsWithPercentage = result.map(item => {
      const totalContribution = item.filesCount + item.commentsCount;
      const totalAllContributions = totalFiles + totalComments;
      const percentage = totalAllContributions > 0 
        ? (totalContribution / totalAllContributions) * 100 
        : 0;
      
      return {
        ...item,
        percentage
      };
    });
    
    // Sort by percentage in descending order
    return resultsWithPercentage.sort((a, b) => b.percentage - a.percentage);
  }

  async getActivityByDay(): Promise<{ date: string; files: number; comments: number }[]> {
    // Get activities grouped by day for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Create an array of dates for the last 30 days
    const dates: { date: string; files: number; comments: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        date: date.toISOString().split('T')[0],
        files: 0,
        comments: 0
      });
    }
    
    // Count file uploads by day
    const filesByDay = await db
      .select({
        date: sql<string>`date(${files.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(files)
      .where(sql`${files.createdAt} >= ${startDate.toISOString()} and ${files.createdAt} <= ${endDate.toISOString()}`)
      .groupBy(sql`date(${files.createdAt})`);
    
    // Count comments by day
    const commentsByDay = await db
      .select({
        date: sql<string>`date(${comments.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(comments)
      .where(sql`${comments.createdAt} >= ${startDate.toISOString()} and ${comments.createdAt} <= ${endDate.toISOString()}`)
      .groupBy(sql`date(${comments.createdAt})`);
    
    // Merge the data
    filesByDay.forEach(item => {
      const dateItem = dates.find(d => d.date === item.date);
      if (dateItem) {
        dateItem.files = item.count;
      }
    });
    
    commentsByDay.forEach(item => {
      const dateItem = dates.find(d => d.date === item.date);
      if (dateItem) {
        dateItem.comments = item.count;
      }
    });
    
    // Sort by date
    return dates.sort((a, b) => a.date.localeCompare(b.date));
  }

  async downloadFile(fileId: number): Promise<{ content: Buffer; fileName: string; contentType: string }> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    
    // Determine content type based on file type
    let contentType = "application/octet-stream"; // Default
    if (file.type === "Image") {
      contentType = "image/jpeg"; // Assuming JPEG for simplicity
    } else if (file.type === "PDF") {
      contentType = "application/pdf";
    } else if (file.type === "Document") {
      contentType = "application/msword";
    } else if (file.type === "Spreadsheet") {
      contentType = "application/vnd.ms-excel";
    } else if (file.type === "Text" || file.type === "JavaScript" || file.type === "HTML" || file.type === "CSS") {
      contentType = "text/plain";
    }
    
    // Read the file from the filesystem
    const fileName = path.basename(file.path);
    const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
    const content = await fs.promises.readFile(path.join(uploadDir, fileName));
    
    return {
      content,
      fileName: file.name,
      contentType
    };
  }

  async downloadProject(): Promise<Buffer> {
    // This is a placeholder implementation
    // In a real system, you would collect all files and zip them
    return Buffer.from("Project files would be zipped here");
  }
}

// Export an instance of the DatabaseStorage class
export const storage = new DatabaseStorage();