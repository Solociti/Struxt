import { ProjectModel } from "common/models/projects/ProjectModel";
import { getClient, getKey, setEx } from "server/database/dragonFly";
import { getCollection } from "server/database/mongodb";
import { calcDirSize } from "server/utils/calcDirSize";
import { getProjectFilesDir } from "server/utils/uploadDir";

class ProjectDiskUsage {
  projectId: string;

  /**
   * The maximum storage allowed for the project
   */
  maxStorageBytes: number = 0;

  reservationKey: string;
  usageKey: string;

  constructor(projectId: string) {
    this.projectId = projectId;

    this.reservationKey = `project:${projectId}:reservations`;
    this.usageKey = `project:${projectId}:storage`;
  }

  async init() {
    await this.loadMaxUsage();
  }

  /**
   * Load the maximum storage for the project
   */
  async loadMaxUsage() {
    const collection = await getCollection<ProjectModel>("projects");
    const doc = await collection.findOne(
      {
        projectId: this.projectId,
      },
      {
        projection: {
          projectId: 1,
          storage: 1,
        },
      },
    );

    this.maxStorageBytes = doc?.storage.maxBytes || 0;
  }

  /**
   * Load the current usage for the project
   */
  async loadUsage() {
    const cachedUsage = await getKey(`project:${this.projectId}:storage`);
    if (cachedUsage) {
      return parseInt(cachedUsage);
    }

    // calculate from disk
    const dir = getProjectFilesDir(this.projectId);
    const usage = await calcDirSize(dir);

    await setEx(`project:${this.projectId}:storage`, 60 * 15, usage.toString());

    return usage;
  }

  /**
   * Get the current reservations for the project
   */
  async getReservedSpace() {
    const client = await getClient();

    try {
      const hash = await client.hGetAll(
        `project:${this.projectId}:reservations`,
      );
      if (!hash) {
        return 0;
      }

      return Object.values(hash).reduce((sum, val) => sum + parseInt(val), 0);
    } catch {
      return 0;
    }
  }

  /**
   * Returns true if there is enough space available on disk
   * to store the given number of bytes.
   *
   * @param bytes
   * @returns
   */
  async hasSpaceAvailable(bytes: number) {
    const usage = await this.loadUsage();
    const reserved = await this.getReservedSpace();

    return usage + reserved + bytes <= this.maxStorageBytes;
  }

  /**
   * Reserves space for the given path.
   *
   * This does not check if the space is available, it just reserves it.
   *
   * @param path
   * @param currentBytes
   * @param newBytes
   * @returns
   */
  async reserveSpace(path: string, currentBytes: number, newBytes: number) {
    const diff = newBytes - currentBytes;
    if (diff <= 0) {
      // don't need to reserve any extra space
      return;
    }

    try {
      const client = await getClient();

      await client.hSet(this.reservationKey, path, diff.toString());
      await client.hExpire(this.reservationKey, path, 60 * 5);
    } catch {
      // ignore errors
    }
  }

  /**
   * Clear the reservation for the given path
   *
   * @param path
   */
  async clearReservation(path: string) {
    try {
      const client = await getClient();

      await client.hDel(this.reservationKey, path);
    } catch {
      // ignore errors
    }
  }
}

/**
 * Get the storage usage and limits for the project
 *
 * @param projectId
 * @returns
 */

export async function getProjectDiskUsage(projectId: string) {
  const usage = new ProjectDiskUsage(projectId);
  await usage.init();

  return usage;
}
