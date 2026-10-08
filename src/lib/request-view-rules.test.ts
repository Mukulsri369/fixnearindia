import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canViewAllRequests, canViewDashboardRating, matchesRequestLocation } from "./request-view-rules";

describe("request dashboard rules", () => {
  test("only admins can see all repair and AMC requests", () => {
    assert.equal(canViewAllRequests(["admin", "customer"]), true);
    assert.equal(canViewAllRequests(["customer", "technician"]), false);
  });
  test("customer dashboards do not show a rating tile", () => {
    assert.equal(canViewDashboardRating(false), false);
    assert.equal(canViewDashboardRating(true), true);
  });
  test("AMC state filtering excludes requests in another state", () => {
    assert.equal(matchesRequestLocation({ state: "Delhi", city: "New Delhi" }, "Delhi"), true);
    assert.equal(matchesRequestLocation({ state: "Haryana", city: "Gurugram" }, "Delhi"), false);
  });
  test("AMC city filtering narrows requests inside the selected state", () => {
    assert.equal(matchesRequestLocation({ state: "Uttar Pradesh", city: "Noida" }, "Uttar Pradesh", "noida"), true);
    assert.equal(matchesRequestLocation({ state: "Uttar Pradesh", city: "Lucknow" }, "Uttar Pradesh", "Noida"), false);
  });
  test("clearing location filters restores matching requests from all locations", () => {
    assert.equal(matchesRequestLocation({ state: "Delhi", city: "New Delhi" }, null, null), true);
    assert.equal(matchesRequestLocation({ state: "Haryana", city: "Gurugram" }, null, null), true);
  });
});