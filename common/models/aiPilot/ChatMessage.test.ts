import { describe, expect, test } from "vitest";
import { AiChatMessage, UserChatMessage } from "./ChatMessage";

describe("UserChatMessage", () => {
  test("should initialize with default values", () => {
    const message = new UserChatMessage();

    const date = Math.floor(Date.now() / 1000);
    expect(message.created.date).within(date - 5, date);
    message.created.date = 0;

    expect(message).toEqual({
      uuid: "",
      chatId: "",
      isUserMessage: true,
      content: "",
      created: {
        date: 0,
        userId: "",
        displayName: "",
      },
    });
  });

  test("should initialize with provided data", () => {
    const data = {
      uuid: "test-uuid",
      chatId: "test-chat",
      content: "test message",
      created: { userId: "user1", displayName: "Test User", date: 123456 },
    };

    const message = new UserChatMessage(data);

    expect(message).toEqual({
      uuid: "test-uuid",
      chatId: "test-chat",
      isUserMessage: true,
      content: "test message",
      created: {
        date: 123456,
        userId: "user1",
        displayName: "Test User",
      },
    });
  });

  test("should clone the model correctly", () => {
    const data = { uuid: "test-uuid", content: "test message" };
    const message = new UserChatMessage(data);

    const cloned = message.clone();

    expect(cloned).toBeInstanceOf(UserChatMessage);
    expect(cloned).not.toBe(message);
    expect(cloned).toEqual(message);
  });
});

describe("AiChatMessage", () => {
  test("should initialize with default values", () => {
    const message = new AiChatMessage();

    const date = Math.floor(Date.now() / 1000);
    expect(message.created.date).within(date - 5, date);
    message.created.date = 0;

    expect(message).toEqual({
      uuid: "",
      chatId: "",
      isUserMessage: false,
      contents: [],
      metadata: {
        model: "",
        temperature: 0,
      },
      tokens: {
        completion: 0,
        consumed: 0,
        prompt: 0,
        total: 0,
      },
      created: {
        date: 0,
        displayName: "",
        userId: "",
      },
    });
  });

  test("should initialize with provided data", () => {
    const data = {
      uuid: "test-uuid",
      chatId: "test-chat",
      metadata: { model: "gpt-4", temperature: 0.7 },
      created: {
        date: 123,
      },
    };

    const message = new AiChatMessage(data);

    expect(message).toEqual({
      uuid: "test-uuid",
      chatId: "test-chat",
      isUserMessage: false,
      contents: [],
      metadata: {
        model: "gpt-4",
        temperature: 0.7,
      },
      created: {
        date: 123,
        userId: "",
        displayName: "",
      },
      tokens: {
        completion: 0,
        consumed: 0,
        prompt: 0,
        total: 0,
      },
    });
  });

  test("should clone the model correctly", () => {
    const data = {
      uuid: "test-uuid",
      metadata: { model: "gpt-4", temperature: 0.7 },
    };
    const message = new AiChatMessage(data);

    const cloned = message.clone();

    expect(cloned).toBeInstanceOf(AiChatMessage);
    expect(cloned).not.toBe(message);
    expect(cloned).toEqual(message);
  });

  test("should merge content correctly - simple", () => {
    const message = new AiChatMessage({
      uuid: "test-uuid",
      contents: [
        {
          msgType: "ai",
          category: "message",
          content: "Hello",
        },
        {
          msgType: "ai",
          category: "message",
          content: " World\n",
        },
        {
          msgType: "ai",
          category: "message",
          content: "This is a test.",
        },
      ],
    });

    expect(message.getMergedContent()).toEqual([
      {
        msgType: "ai",
        category: "message",
        content: "Hello World\nThis is a test.",
        contentId: "",
        uid: "",
        action: "",
      },
    ]);
  });

  test("should merge content correctly - mixed", () => {
    const message = new AiChatMessage({
      uuid: "test-uuid",
      contents: [
        {
          msgType: "ai",
          category: "message",
          content: "Hello",
        },
        {
          msgType: "ai",
          category: "message",
          content: " World\n",
        },
        {
          msgType: "ai",
          category: "tool_call",
          content: "[Action performed]",
        },
        {
          msgType: "ai",
          category: "message",
          content: "This is a test.",
        },
      ],
    });

    expect(message.getMergedContent()).toEqual([
      {
        msgType: "ai",
        category: "message",
        content: "Hello World\n",
        contentId: "",
        action: "",
        uid: "",
      },
      {
        msgType: "ai",
        category: "tool_call",
        content: "[Action performed]",
        contentId: "",
        action: "",
        uid: "",
      },
      {
        msgType: "ai",
        category: "message",
        content: "This is a test.",
        contentId: "",
        action: "",
        uid: "",
      },
    ]);
  });
});
