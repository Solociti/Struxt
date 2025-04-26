import { describe, expect, test } from "vitest";
import { capitalizeWords, formatLabel } from "./formatText";

describe("formatText Utilities", () => {
  describe("capitalizeWords", () => {
    test("should capitalize the first letter of each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");

      expect(capitalizeWords("typescript")).toBe("Typescript");

      expect(capitalizeWords("  leading space  ")).toBe("  Leading Space  ");

      expect(capitalizeWords("Already Capitalized")).toBe(
        "Already Capitalized"
      );
    });

    test("should handle empty strings", () => {
      expect(capitalizeWords("")).toBe("");
    });
  });

  describe("formatLabel", () => {
    test("should format snake_case labels", () => {
      expect(formatLabel("first_name")).toBe("First Name");
    });

    test("should format kebab-case labels", () => {
      expect(formatLabel("last-name")).toBe("Last Name");
    });

    test("should handle mixed snake_case and kebab-case", () => {
      expect(formatLabel("user_profile-settings")).toBe(
        "User Profile Settings"
      );
    });
  });
});
