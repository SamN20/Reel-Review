import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl, normalizeApiBaseUrlForLocation } from "./api";

describe("normalizeApiBaseUrl", () => {
  it("upgrades same-host http api urls on https pages", () => {
    expect(
      normalizeApiBaseUrlForLocation("http://beta-reelreview.bynolo.ca", {
        origin: "https://beta-reelreview.bynolo.ca",
        protocol: "https:",
        hostname: "beta-reelreview.bynolo.ca",
        port: "",
      }),
    ).toBe("");
  });

  it("preserves external origins", () => {
    expect(
      normalizeApiBaseUrlForLocation("https://api.example.com", {
        origin: "https://beta-reelreview.bynolo.ca",
        protocol: "https:",
        hostname: "beta-reelreview.bynolo.ca",
        port: "",
      }),
    ).toBe("https://api.example.com");
  });

  it("returns an empty string for blank config", () => {
    expect(normalizeApiBaseUrl("")).toBe("");
  });
});
