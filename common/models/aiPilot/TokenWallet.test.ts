import { describe, expect, test } from "vitest";
import { TokenWallet } from "./TokenWallet";

describe("TokenWallet", () => {
  const currentMonth = TokenWallet.convertDate();
  const lastMonth = (() => {
    const [year, month] = currentMonth.split("-").map(Number);
    const lastMonthDate = new Date(year, month - 2);

    return TokenWallet.convertDate(lastMonthDate);
  })();
  const nextMonth = (() => {
    const [year, month] = currentMonth.split("-").map(Number);
    const nextMonthDate = new Date(year, month);

    return TokenWallet.convertDate(nextMonthDate);
  })();

  test("should initialize with default values", () => {
    let now = Math.floor(Date.now() / 1000);
    const model = new TokenWallet();

    expect(model.created.date).toBeGreaterThanOrEqual(now);

    expect(model).toEqual({
      emergencyLimit: 250,
      lastRefillMonth: currentMonth,
      monthlyAllowance: 500,
      monthlyUsage: 0,
      prepaidBalance: 0,
      prepaidBatches: [],
      projectId: "",
      created: {
        userId: "",
        displayName: "",
        date: expect.any(Number),
      },
    });
  });

  test("should initialize with provided data", () => {
    const model = new TokenWallet({
      lastRefillMonth: "2025-10",
      monthlyAllowance: 650,
      created: {
        date: 123456,
      },
    });

    expect(model).toEqual({
      emergencyLimit: 250,
      lastRefillMonth: "2025-10",
      monthlyAllowance: 650,
      monthlyUsage: 0,
      prepaidBalance: 0,
      prepaidBatches: [],
      projectId: "",
      created: {
        userId: "",
        displayName: "",
        date: 123456,
      },
    });
  });

  test("should clone the model correctly", () => {
    const model = new TokenWallet();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(TokenWallet);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });

  describe("needsMonthlyRefill", () => {
    test("should return true if lastRefillMonth is before current month", () => {
      const model = new TokenWallet({
        lastRefillMonth: "2025-01",
      });

      expect(model.needsMonthlyRefill("2025-02")).toBe(true);
    });

    test("should return false if lastRefillMonth is the current month", () => {
      const model = new TokenWallet({
        lastRefillMonth: "2025-02",
      });

      expect(model.needsMonthlyRefill("2025-02")).toBe(false);
    });

    test("should return false if lastRefillMonth is after current month", () => {
      const model = new TokenWallet({
        lastRefillMonth: "2025-03",
      });

      expect(model.needsMonthlyRefill("2025-02")).toBe(false);
    });

    test("should use current month if none provided", () => {
      const last = new TokenWallet({
        lastRefillMonth: lastMonth,
      });
      const current = new TokenWallet({
        lastRefillMonth: currentMonth,
      });
      const next = new TokenWallet({
        lastRefillMonth: nextMonth,
      });

      expect(last.needsMonthlyRefill()).toBe(true);
      expect(current.needsMonthlyRefill()).toBe(false);
      expect(next.needsMonthlyRefill()).toBe(false);
    });
  });

  describe("calculateMonthlyRefill", () => {
    test("should calculate monthly refill details for last month", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        monthlyUsage: 400,
        lastRefillMonth: lastMonth,
      });

      const result = model.calculateMonthlyRefill();

      expect(result).toEqual({
        currentMonth: currentMonth,
        remainingMonthlyUsage: 0,
      });
    });

    test("should calculate monthly refill details for last month with emergency used", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        monthlyUsage: 600,
        lastRefillMonth: lastMonth,
      });

      const result = model.calculateMonthlyRefill();

      expect(result).toEqual({
        currentMonth: currentMonth,
        remainingMonthlyUsage: 100,
      });
    });

    test("should calculate monthly refill details for 2 months ago", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        monthlyUsage: 700,
        lastRefillMonth: (() => {
          const [year, month] = currentMonth.split("-").map(Number);
          const twoMonthsAgoDate = new Date(year, month - 3);
          return TokenWallet.convertDate(twoMonthsAgoDate);
        })(),
      });

      const result = model.calculateMonthlyRefill();

      expect(result).toEqual({
        currentMonth: currentMonth,
        remainingMonthlyUsage: 0,
      });
    });
  });

  describe("splitTokens", () => {
    test("should use only monthly tokens", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 200,
      });

      const result = model.splitTokens(400);

      expect(result).toEqual({
        fromMonthly: 400,
        fromPrepaid: 0,
      });
    });

    test("should use only prepaid tokens", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 300,
        monthlyUsage: 500,
      });

      const result = model.splitTokens(200);

      expect(result).toEqual({
        fromMonthly: 0,
        fromPrepaid: 200,
      });
    });

    test("should use both monthly and prepaid tokens", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 150,
        monthlyUsage: 400,
      });

      const result = model.splitTokens(200);

      expect(result).toEqual({
        fromMonthly: 100,
        fromPrepaid: 100,
      });
    });

    test("should use emergency monthly tokens when prepaid and monthly are exhausted", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 100,
        monthlyUsage: 600,
      });

      const result = model.splitTokens(300);

      expect(result).toEqual({
        fromMonthly: 200,
        fromPrepaid: 100,
      });
    });
  });

  describe("hasTokensAvailable", () => {
    test("should return true for both general and emergency when tokens are available", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 100,
        monthlyUsage: 400,
      });

      const result = model.hasTokensAvailable();

      expect(result).toEqual({
        general: true,
        emergency: true,
      });
    });

    test("should return true for general when monthly or prepaid tokens are available", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 50,
        monthlyUsage: 500,
      });

      const result = model.hasTokensAvailable();

      expect(result).toEqual({
        general: true,
        emergency: true,
      });
    });

    test("should return false for general but true for emergency when only emergency tokens are available", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 0,
        monthlyUsage: 600,
      });

      const result = model.hasTokensAvailable();

      expect(result).toEqual({
        general: false,
        emergency: true,
      });
    });

    test("should return false for both general and emergency when no tokens are available", () => {
      const model = new TokenWallet({
        monthlyAllowance: 500,
        emergencyLimit: 250,
        prepaidBalance: 0,
        monthlyUsage: 800,
      });

      const result = model.hasTokensAvailable();

      expect(result).toEqual({
        general: false,
        emergency: false,
      });
    });
  });

  describe("static date conversion methods", () => {
    test("should convert date to YYYY-MM format", () => {
      const date = new Date(2025, 4, 15); // May 15, 2025

      const result = TokenWallet.convertDate(date);
      expect(result).toBe("2025-05");
    });

    test("should get current date in YYYY-MM format", () => {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");

      const result = TokenWallet.convertDate();
      expect(result).toBe(`${year}-${month}`);
    });

    test("should parse YYYY-MM string to Date object", () => {
      const dateString = "2025-12";

      const result = TokenWallet.parseDate(dateString);
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(11);
    });
  });
});
