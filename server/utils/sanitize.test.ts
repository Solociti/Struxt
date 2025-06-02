import { expect, test, describe } from "vitest";
import { sanitizeObject, sanitizeValue } from "../utils/sanitize";

describe("sanitize values", () => {
  test("should remove the entire script html", () => {
    const value = "<script>alert('hi');</script>";
    const sanitizedValue = sanitizeValue(value);

    expect(sanitizedValue).to.equal("");
  });

  test("should remove html tags", () => {
    const value = "<p>hello</p>";
    const sanitizedValue = sanitizeValue(value);

    expect(sanitizedValue).to.equal("hello");
  });

  test("should leave the special characters", () => {
    const value = "hello & goodbye! <> \"'";
    const sanitizedValue = sanitizeValue(value);

    expect(sanitizedValue).to.equal("hello & goodbye! <> \"'");
  });

  test("should return the number", () => {
    const value = sanitizeValue(123);

    expect(value).to.equal(123);
  });

  test("should return the boolean", () => {
    const value = sanitizeValue(true);

    expect(value).to.equal(true);
  });

  test("should return null for a object", () => {
    // @ts-expect-error
    const value = sanitizeValue({});
    expect(value).to.equal(null);
  });

  test("fuzz testing sanitizeValue with html", () => {
    const fuzzValues = [
      "<script>alert('xss')</script>",
      "<img src='x' onerror='alert(1)'>",
      "<div>hello</div>",
      "<a href='javascript:alert(1)'>click me</a>",
      "<iframe src='javascript:alert(1)'></iframe>",
      "<svg onload='alert(1)'></svg>",
      "<math><mtext></mtext><script>alert(1)</script></math>",
      "<object data='javascript:alert(1)'></object>",
      "<embed src='javascript:alert(1)'></embed>",
    ];

    fuzzValues.forEach((value) => {
      const sanitizedValue = sanitizeValue(value);

      expect(sanitizedValue).not.to.include("<");
      expect(sanitizedValue).not.to.include(">");
      expect(sanitizedValue).not.to.include("<script>");
      expect(sanitizedValue).not.to.include("onerror");
      expect(sanitizedValue).not.to.include("javascript:");
    });
  });

  test("fuzz testing sanitizeValue with special characters", () => {
    const fuzzValues = [
      "hello & goodbye! <> \"'",
      "hello & goodbye! <> \"' 1234567890",
      "こんにちは 你好 안녕하세요",
      "👋🌍 !@#$%^&*()_+",
      "C'est la vie! <>&\"'",
      "Grüß Gott! <> \"' 123",
      "¡Hola! ¿Qué tal? <> \"'",
      "Привет мир! <> \"'",
      "مرحبا بالعالم! <> \"'",
    ];

    fuzzValues.forEach((value) => {
      const sanitizedValue = sanitizeValue(value);

      expect(sanitizedValue).to.equal(value);
    });
  });
});

describe("sanitize object", () => {
  test("should sanitize an object with various types", () => {
    const obj = {
      name: "<b>John</b>",
      age: 30,
      isActive: true,
      nested: {
        description: "<i>Developer</i>",
        tags: ["<script>alert('xss')</script>", "tag1", "tag2"],
      },
      nullValue: null,
    };

    const sanitizedObj = sanitizeObject(obj);

    expect(sanitizedObj).toEqual({
      name: "John",
      age: 30,
      isActive: true,
      nested: {
        description: "Developer",
        tags: ["", "tag1", "tag2"],
      },
      nullValue: null,
    });
  });

  test("should handle empty objects", () => {
    const obj = {};
    const sanitizedObj = sanitizeObject(obj);

    expect(sanitizedObj).toEqual({});
  });

  test("should handle arrays within arrays", () => {
    const obj = {
      items: [
        "<script>alert('xss')</script>",
        ["<b>Nested</b>", "item2"],
        { key: "<i>Value</i>" },
      ],
      emptyArray: [],
      nullValue: null,
    };
    const sanitizedObj = sanitizeObject(obj);
    expect(sanitizedObj).toEqual({
      items: ["", ["Nested", "item2"], { key: "Value" }],
      emptyArray: [],
      nullValue: null,
    });
  });

  test("should sanitize the object keys", () => {
    const obj = {
      "<script>alert('xss')</script>": "value",
      normalKey: "<b>value</b>",
      nested: {
        "<i>nestedKey</i>": "nestedValue",
      },
    };

    const sanitizedObj = sanitizeObject(obj);

    expect(sanitizedObj).toEqual({
      "": "value",
      normalKey: "value",
      nested: {
        nestedKey: "nestedValue",
      },
    });
  });

  test("should skip sanitization for specified keys", () => {
    const obj = {
      name: "<b>John</b>",
      age: 30,
      isActive: true,
      nested: {
        description: "<i>Developer</i>",
        tags: ["<script>alert('xss')</script>", "tag1", "tag2"],
      },
    };

    const options = {
      "nested.description": { skipSanitize: true },
    };

    const sanitizedObj = sanitizeObject(obj, options);

    expect(sanitizedObj).toEqual({
      name: "John",
      age: 30,
      isActive: true,
      nested: {
        description: "<i>Developer</i>",
        tags: ["", "tag1", "tag2"],
      },
    });
  });

  test("should handle nested objects with options", () => {
    const obj = {
      user: {
        name: "<b>Jane</b>",
        age: 25,
        address: {
          street: "<i>Main St</i>",
          city: "New York",
          zip: "<script>12345</script>",
          country: "USA",
        },
      },
      tags: ["<script>alert('xss')</script>", "tag1", "tag2"],
    };
    const options = {
      "user.address.street": { skipSanitize: true },
      "user.address.zip": { skipSanitize: true },
    };
    const sanitizedObj = sanitizeObject(obj, options);
    expect(sanitizedObj).toEqual({
      user: {
        name: "Jane",
        age: 25,
        address: {
          street: "<i>Main St</i>",
          city: "New York",
          zip: "<script>12345</script>",
          country: "USA",
        },
      },
      tags: ["", "tag1", "tag2"],
    });
  });

  test("should handle items nested in arrays", () => {
    const obj = {
      files: [
        {
          contents: "<b>file 1</b> contents",
          name: "<i>file 1</i>.txt",
        },
        {
          contents: "<b>file 2</b> contents",
          name: "<i>file 2</i>.txt",
        },
      ],
    };

    const sanitizedObj = sanitizeObject(obj, {
      "files.*.contents": { skipSanitize: true },
    });

    expect(sanitizedObj).toEqual({
      files: [
        {
          contents: "<b>file 1</b> contents",
          name: "file 1.txt",
        },
        {
          contents: "<b>file 2</b> contents",
          name: "file 2.txt",
        },
      ],
    });
  });
});
