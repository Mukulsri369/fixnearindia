import { describe, expect, test } from "bun:test";
import { canViewAllRequests, canViewDashboardRating, matchesRequestLocation } from "./request-view-rules";

describe("request dashboard rules", () => {
  test("only admins can see all repair and AMC requests", () => {
    expect(canViewAllRequests(["admin", "customer"])).toBe(true);
    expect(canViewAllRequests(["customer", "technician"])).toBe(false);
  });
  test("customer dashboards do not show a rating tile", () => {
    expect(canViewDashboardRating(false)).toBe(false);
    expect(canViewDashboardRating(true)).toBe(true);
  });
  test("AMC state filtering excludes requests in another state", () => {
    expect(matchesRequestLocation({ state: "Delhi", city: "New Delhi" }, "Delhi")).toBe(true);
    expect(matchesRequestLocation({ state: "Haryana", city: "Gurugram" }, "Delhi")).toBe(false);
  });
  test("AMC city filtering narrows requests inside the selected state", () => {
    expect(matchesRequestLocation({ state: "Uttar Pradesh", city: "Noida" }, "Uttar Pradesh", "noida")).toBe(true);
    expect(matchesRequestLocation({ state: "Uttar Pradesh", city: "Lucknow" }, "Uttar Pradesh", "Noida")).toBe(false);
  });
  test("clearing location filters restores matching requests from all locations", () => {
    expect(matchesRequestLocation({ state: "Delhi", city: "New Delhi" }, null, null)).toBe(true);
    expect(matchesRequestLocation({ state: "Haryana", city: "Gurugram" }, null, null)).toBe(true);
  });
});