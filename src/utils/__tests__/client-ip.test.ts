import { describe, expect, it } from "vitest";
import { clientIpFrom, trustedProxyCount } from "../client-ip";

describe("clientIpFrom", () => {
  it("takes the address the trusted proxy appended, not the one the client sent", () => {
    expect(clientIpFrom("6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(clientIpFrom("6.6.6.6, 203.0.113.9, 10.0.0.2", 2)).toBe("203.0.113.9");
  });

  it("falls back to the first entry when there are fewer entries than proxies", () => {
    expect(clientIpFrom("203.0.113.9", 2)).toBe("203.0.113.9");
  });

  it("ignores the header when no proxy is trusted or it is empty", () => {
    expect(clientIpFrom("203.0.113.9", 0)).toBeNull();
    expect(clientIpFrom(null, 1)).toBeNull();
    expect(clientIpFrom(" , ", 1)).toBeNull();
  });
});

describe("trustedProxyCount", () => {
  it("defaults to one proxy and accepts zero", () => {
    expect(trustedProxyCount(undefined)).toBe(1);
    expect(trustedProxyCount("abc")).toBe(1);
    expect(trustedProxyCount("0")).toBe(0);
    expect(trustedProxyCount("2")).toBe(2);
  });
});
