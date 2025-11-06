import { describe, expect, test } from "vitest";
import { TokenTransactions } from "./TokenTransactions";
import { TokenWallet } from "./TokenWallet";

describe("TokenTransactions", () => {
  const currentMonth = TokenWallet.convertDate();

  test("should initialize with default values", () => {
    const now = Math.floor(Date.now() / 1000);
    const model = new TokenTransactions();

    expect(model.created.date).toBeGreaterThanOrEqual(now);

    expect(model).toEqual({
      chatId: "",
      created: {
        date: expect.any(Number),
        displayName: "",
        userId: "",
      },
      createdMonth: currentMonth,
      messageId: "",
      monthlyTokens: 0,
      notes: "",
      prepaidTokens: 0,
      projectId: "",
      purchaseId: "",
      transactionType: "usage",
      uuid: "",
    });
  });

  test("should initialize with provided data", () => {
    const model = new TokenTransactions({
      created: {
        date: 123456,
      },
      projectId: "project_123",
      createdMonth: "2025-11",
    });

    expect(model).toEqual({
      chatId: "",
      created: {
        date: 123456,
        displayName: "",
        userId: "",
      },
      createdMonth: "2025-11",
      messageId: "",
      monthlyTokens: 0,
      notes: "",
      prepaidTokens: 0,
      projectId: "project_123",
      purchaseId: "",
      transactionType: "usage",
      uuid: "",
    });
  });

  test("should clone the model correctly", () => {
    const model = new TokenTransactions();

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(TokenTransactions);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
