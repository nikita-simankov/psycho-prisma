import { describe, expect, it } from "vitest";
import { environmentProblems } from "../environment";

const base = { NODE_ENV: "production", DATABASE_URL: "postgresql://x", APP_URL: "https://calibre.example", RESEND_API_KEY: "re_1" };

describe("environmentProblems", () => {
  it("accepts a complete production setup", () => {
    expect(environmentProblems(base)).toEqual({ errors: [], warnings: [] });
  });

  it("requires APP_URL in production, where links would otherwise follow the Host header", () => {
    expect(environmentProblems({ ...base, APP_URL: undefined }).errors).toHaveLength(1);
    expect(environmentProblems({ ...base, NODE_ENV: "development", APP_URL: undefined }).errors).toEqual([]);
  });

  it("rejects an APP_URL that isn't an http(s) address", () => {
    expect(environmentProblems({ ...base, APP_URL: "calibre.example" }).errors).toHaveLength(1);
    expect(environmentProblems({ ...base, APP_URL: "ftp://calibre.example" }).errors).toHaveLength(1);
  });

  it("requires a database", () => {
    expect(environmentProblems({ ...base, DATABASE_URL: "" }).errors).toEqual(["DATABASE_URL is not set."]);
  });

  it("warns about half-configured integrations and a job nothing runs", () => {
    const { errors, warnings } = environmentProblems({ ...base, RESEND_API_KEY: undefined, GOOGLE_CLIENT_ID: "id", DISABLE_SCHEDULER: "1" });
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(3);
    expect(warnings.join(" ")).toContain("GOOGLE_CLIENT_SECRET");
  });
});
