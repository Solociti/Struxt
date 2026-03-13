import { ComponentType } from "react";
import { AssetFileSection } from "./AssetFileSection";
import { EnvironmentSection } from "./EnvironmentSection";
import { RoutineEnvSection } from "./RoutineEnvSection";
import { ExtraSettingsSection } from "./ExtraSettingsSection";

export interface SidebarSectionDef {
  id: string;
  title: string;
  isFlex: boolean;
  canCollapse: boolean;
  defaultHeight?: number;
  defaultCollapsed?: boolean;
  contentComponent: ComponentType;
}

/**
 * All sidebar sections in render order.
 * Section 0 must always be the flex section (isFlex: true).
 * Sections 1..N are fixed-height sections.
 * To add a section, append an entry here — no other code changes needed.
 */
export const sidebarSections: SidebarSectionDef[] = [
  {
    id: "assets",
    title: "Assets",
    isFlex: true,
    canCollapse: false,
    contentComponent: AssetFileSection,
  },
  {
    id: "routine-env",
    title: "Routine Environments",
    isFlex: false,
    canCollapse: true,
    defaultHeight: 150,
    defaultCollapsed: true,
    contentComponent: RoutineEnvSection,
  },
  {
    id: "env",
    title: "Environments",
    isFlex: false,
    canCollapse: true,
    defaultHeight: 150,
    defaultCollapsed: false,
    contentComponent: EnvironmentSection,
  },
  {
    id: "settings",
    title: "Settings",
    isFlex: false,
    canCollapse: true,
    defaultHeight: 100,
    defaultCollapsed: true,
    contentComponent: ExtraSettingsSection,
  },
];

/**
 * Returns the initial heights for all fixed (non-flex) sections.
 */
export function buildDefaultHeights(): number[] {
  return sidebarSections.slice(1).map((s) => s.defaultHeight ?? 150);
}

/**
 * Returns the initial collapsed state for all sections (including the flex section).
 */
export function buildDefaultCollapsed(): boolean[] {
  return sidebarSections.map((s) => s.defaultCollapsed ?? false);
}
