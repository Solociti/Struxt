import { expect, test, describe } from "vitest";
import { sanitizeValue } from "./sanitize";

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
