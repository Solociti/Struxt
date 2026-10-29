import { describe, expect, it } from "vitest";
import {
  backupDateValue,
  parseBackupFileName,
  parseRestorePointId,
} from "./backupFileNames";

describe("parseBackupFileName", () => {
  it("parses every backup file type", () => {
    expect(parseBackupFileName("0.dragonfly.tar.gz")).toEqual({
      hour: 0,
      component: "dragonfly",
    });
    expect(parseBackupFileName("12-victoria-metrics.tar.gz")).toEqual({
      hour: 12,
      component: "victoriametrics",
    });
    expect(parseBackupFileName("3-grafana.tar.gz")?.component).toBe("grafana");
    expect(parseBackupFileName("3-nginx.tar.gz")?.component).toBe("nginx");
    expect(parseBackupFileName("12-struxt.mongodb.gz")).toEqual({
      hour: 12,
      component: "mongo",
      dbName: "struxt",
    });
  });

  it("ignores unknown files", () => {
    expect(parseBackupFileName("notes.txt")).toBeNull();
    expect(parseBackupFileName("12-struxt;rm.mongodb.gz")).toBeNull();
  });
});

describe("parseRestorePointId", () => {
  it("accepts valid ids", () => {
    expect(parseRestorePointId("5-3-2026/12")).toEqual({
      date: "5-3-2026",
      hour: 12,
    });
  });

  it("rejects invalid ids", () => {
    expect(parseRestorePointId("5-3-2026/24")).toBeNull();
    expect(parseRestorePointId("../etc/12")).toBeNull();
    expect(parseRestorePointId("5-3-2026/1/2")).toBeNull();
    expect(parseRestorePointId(12)).toBeNull();
  });
});

describe("backupDateValue", () => {
  it("sorts by year, month and day", () => {
    expect(backupDateValue("1-2-2026")).toBeGreaterThan(
      backupDateValue("30-1-2026"),
    );
    expect(backupDateValue("1-1-2027")).toBeGreaterThan(
      backupDateValue("31-12-2026"),
    );
  });
});
