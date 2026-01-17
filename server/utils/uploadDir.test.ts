import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getAssetDir,
  getBackupDir,
  getBasePublishDir,
  getCurrentBackupDir,
  getProjectFilesDir,
  getProjectFormUploadDir,
  getProjectPublicDir,
  getProjectsParentDir,
  getPublishDir,
  getScreenshotDir,
  getUploadDir,
} from "./uploadDir";

describe("uploadDir", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables
    delete process.env.UPLOAD_DIR;
    delete process.env.BACKUP_DIR;
    delete process.env.SITE_STORAGE_DIR;
    delete process.env.IS_DOCKER;
  });

  afterEach(() => {
    // Restore original environment variables
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe("getUploadDir", () => {
    it("should return default upload directory", () => {
      const result = getUploadDir();
      expect(result).toBe("/uploads");
    });

    it("should return custom upload directory from env", () => {
      process.env.UPLOAD_DIR = "/custom/uploads";
      const result = getUploadDir();
      expect(result).toBe("/custom/uploads");
    });

    it("should return docker upload directory when IS_DOCKER is true", () => {
      process.env.UPLOAD_DIR = "/custom/uploads";
      process.env.IS_DOCKER = "true";
      const result = getUploadDir();
      expect(result).toBe("/uploads");
    });

    it("should join paths correctly", () => {
      const result = getUploadDir("subfolder", "file.txt");
      expect(result).toBe("/uploads/subfolder/file.txt");
    });
  });

  describe("getBackupDir", () => {
    it("should return default backup directory", () => {
      const result = getBackupDir();
      expect(result).toBe("/backup");
    });

    it("should return custom backup directory from env", () => {
      process.env.BACKUP_DIR = "/custom/backup";
      const result = getBackupDir();
      expect(result).toBe("/custom/backup");
    });

    it("should return docker backup directory when IS_DOCKER is true", () => {
      process.env.BACKUP_DIR = "/custom/backup";
      process.env.IS_DOCKER = "true";
      const result = getBackupDir();
      expect(result).toBe("/backup");
    });

    it("should join paths correctly", () => {
      const result = getBackupDir("subfolder");
      expect(result).toBe("/backup/subfolder");
    });
  });

  describe("getCurrentBackupDir", () => {
    it("should return backup directory with current date", () => {
      const result = getCurrentBackupDir();
      expect(result).toMatch(/^\/backup\/\d{1,2}-\d{1,2}-\d{4}$/);
    });
  });

  describe("getProjectsParentDir", () => {
    it("should return projects directory", () => {
      const result = getProjectsParentDir();
      expect(result).toBe("/uploads/projects");
    });

    it("should join additional paths", () => {
      const result = getProjectsParentDir("project123");
      expect(result).toBe("/uploads/projects/project123");
    });
  });

  describe("getProjectFilesDir", () => {
    it("should return project files directory", () => {
      const result = getProjectFilesDir("project123");
      expect(result).toBe("/uploads/projects/project123/files");
    });
  });

  describe("getProjectPublicDir", () => {
    it("should return project public directory", () => {
      const result = getProjectPublicDir("project123");
      expect(result).toBe("/uploads/projects/project123/files/public");
    });
  });

  describe("getAssetDir", () => {
    it("should return asset directory", () => {
      const result = getAssetDir("project123");
      expect(result).toBe("/uploads/projects/project123/files/public/assets");
    });
  });

  describe("getScreenshotDir", () => {
    it("should return screenshot directory without projectId", () => {
      const result = getScreenshotDir();
      expect(result).toBe("/uploads/screenshots");
    });

    it("should return screenshot directory with projectId", () => {
      const result = getScreenshotDir("project123");
      expect(result).toBe("/uploads/screenshots/project123");
    });
  });

  describe("getProjectFormUploadDir", () => {
    it("should return form upload directory with projectId", () => {
      const result = getProjectFormUploadDir("project123");
      expect(result).toBe("/uploads/projects/project123/forms");
    });
  });

  describe("getBasePublishDir", () => {
    it("should return default publish directory", () => {
      const result = getBasePublishDir();
      expect(result).toBe("/sites");
    });

    it("should return custom publish directory from env", () => {
      process.env.SITE_STORAGE_DIR = "/custom/sites";
      const result = getBasePublishDir();
      expect(result).toBe("/custom/sites");
    });

    it("should return docker publish directory when IS_DOCKER is true", () => {
      process.env.SITE_STORAGE_DIR = "/custom/sites";
      process.env.IS_DOCKER = "true";
      const result = getBasePublishDir();
      expect(result).toBe("/sites");
    });
  });

  describe("getPublishDir", () => {
    it("should return publish directory for staging environment", () => {
      const result = getPublishDir("project123", "staging", "publish456");
      expect(result).toBe("/sites/project123/staging/publish456");
    });

    it("should return publish directory for production environment", () => {
      const result = getPublishDir("project789", "production", "publish999");
      expect(result).toBe("/sites/project789/production/publish999");
    });
  });
});
