import { describe, expect, it } from "vitest";
import { registerSchema } from "./validation";

describe("registerSchema", () => {
  it("requires a valid email so account data can be recovered", () => {
    expect(registerSchema.safeParse({ displayName: "Ahmed", email: "", agreedToRules: true }).success).toBe(false);
    expect(registerSchema.safeParse({ displayName: "Ahmed", agreedToRules: true }).success).toBe(false);
    expect(registerSchema.safeParse({ displayName: "Ahmed", email: "not-an-email", agreedToRules: true }).success).toBe(false);
  });

  it("normalizes email before storing it", () => {
    const parsed = registerSchema.parse({ displayName: "Ahmed", email: "  USER@Example.COM  ", agreedToRules: true });
    expect(parsed.email).toBe("user@example.com");
  });
});
