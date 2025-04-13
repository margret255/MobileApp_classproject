import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { insertCommentSchema } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { promisify } from "util";

// Extend the Express Request type to include the file property from multer
declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
  }
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mkdir = promisify(fs.mkdir);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to check authentication
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Create a temporary directory for file storage if needed
  const uploadDir = path.resolve(__dirname, "../uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }

  // ===== Project Routes =====
  app.get("/api/projects", ensureAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== File Routes =====
  app.get("/api/files", ensureAuthenticated, async (req, res) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/files/recent", ensureAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const files = await storage.getRecentFiles(limit);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/files/:id", ensureAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/files/upload", ensureAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      if (!req.body.name) {
        return res.status(400).json({ error: "File name is required" });
      }
      
      const user = req.user!;
      const projectId = 1; // Default project for now
      
      // Determine file type based on extension or mime type
      let fileType = "Unknown";
      const mimeType = req.file.mimetype;
      const extension = req.body.name.split('.').pop()?.toLowerCase();
      
      if (mimeType.startsWith("image/")) {
        fileType = "Image";
      } else if (mimeType === "application/pdf") {
        fileType = "PDF";
      } else if (mimeType === "application/json") {
        fileType = "JSON";
      } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || extension === "csv") {
        fileType = "Spreadsheet";
      } else if (mimeType.includes("word") || mimeType.includes("document")) {
        fileType = "Document";
      } else if (extension === "js") {
        fileType = "JavaScript";
      } else if (extension === "html") {
        fileType = "HTML";
      } else if (extension === "css") {
        fileType = "CSS";
      } else if (extension === "ts" || extension === "tsx") {
        fileType = "TypeScript";
      } else if (extension === "py") {
        fileType = "Python";
      } else if (extension === "java") {
        fileType = "Java";
      } else if (extension === "c" || extension === "cpp" || extension === "h") {
        fileType = "C/C++";
      } else if (mimeType.includes("text")) {
        fileType = "Text";
      } else {
        fileType = extension ? extension.toUpperCase() : "Unknown";
      }
      
      // Create the file record
      const file = await storage.createFile({
        name: req.body.name,
        type: fileType,
        size: req.file.size,
        path: "", // This will be assigned by the storage
        description: req.body.description || undefined,
        userId: user.id,
        projectId: projectId,
        content: req.file.buffer
      });
      
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/files/:id/download", ensureAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const fileData = await storage.downloadFile(fileId);
      
      res.setHeader("Content-Type", fileData.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileData.fileName}"`);
      res.send(fileData.content);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== File Versions Routes =====
  app.get("/api/files/:id/versions", ensureAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const versions = await storage.getFileVersions(fileId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== Comments Routes =====
  app.get("/api/comments", ensureAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/files/:id/comments", ensureAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const comments = await storage.getFileComments(fileId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/files/:id/comments", ensureAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const user = req.user!;
      
      // Validate the comment text
      const result = insertCommentSchema.safeParse({
        text: req.body.text,
        fileId,
        userId: user.id,
      });
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid comment data" });
      }
      
      const comment = await storage.createComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== Activity Routes =====
  app.get("/api/activities", ensureAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== Statistics Routes =====
  app.get("/api/stats", ensureAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/contributions", ensureAuthenticated, async (req, res) => {
    try {
      const contributions = await storage.getContributions();
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/activity-by-day", ensureAuthenticated, async (req, res) => {
    try {
      const activityByDay = await storage.getActivityByDay();
      res.json(activityByDay);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== User Routes =====
  app.get("/api/users", ensureAuthenticated, async (req, res) => {
    try {
      const users = Array.from(await storage.getProjects())
        .map(async (project) => {
          const projectMembers = await storage.getProjectMembers(project.id);
          const contributions = await storage.getContributions();
          
          // Convert to UserType format
          return projectMembers.map(member => {
            const user = member.user;
            const contribution = contributions.find(c => c.userId === user.id) || {
              percentage: 0,
              filesCount: 0,
              commentsCount: 0
            };
            
            // Calculate percentages for files and comments
            const totalFiles = contributions.reduce((sum, c) => sum + c.filesCount, 0);
            const totalComments = contributions.reduce((sum, c) => sum + c.commentsCount, 0);
            
            const filesPercentage = totalFiles > 0 ? (contribution.filesCount / totalFiles) * 100 : 0;
            const commentsPercentage = totalComments > 0 ? (contribution.commentsCount / totalComments) * 100 : 0;
            
            return {
              id: user.id,
              name: user.fullName || user.username,
              email: user.email || `${user.username}@example.com`,
              avatarUrl: user.avatarUrl,
              stats: {
                files: contribution.filesCount,
                comments: contribution.commentsCount,
                filesPercentage,
                commentsPercentage,
                contributionPercentage: contribution.percentage
              }
            };
          });
        });
      
      // Flatten the array of arrays
      const allUsers = (await Promise.all(users)).flat();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== Invite Routes =====
  app.post("/api/invites", ensureAuthenticated, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // In a real implementation, you would send an email invitation
      // For this demo, we'll just return a success message
      
      res.status(200).json({ message: `Invitation sent to ${email}` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ===== Project Download Route =====
  app.get("/api/project/download", ensureAuthenticated, async (req, res) => {
    try {
      const zipData = await storage.downloadProject();
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="project-files.zip"`);
      res.send(zipData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
