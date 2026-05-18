import { beforeEach, describe, expect, it } from "vitest";

import { captureReferralInvite, getReferralCookieValue, isValidInviteCode } from "./referral";

describe("referral helpers", () => {
  beforeEach(() => {
    document.cookie = "rr_invite=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  });

  it("validates invite codes and stores the latest one in a cookie", () => {
    expect(isValidInviteCode("invite123")).toBe(true);
    expect(isValidInviteCode("bad code")).toBe(false);

    const first = captureReferralInvite("invite123");
    expect(first).toBe("INVITE123");
    expect(getReferralCookieValue()).toBe("INVITE123");

    const second = captureReferralInvite("newcode456");
    expect(second).toBe("NEWCODE456");
    expect(getReferralCookieValue()).toBe("NEWCODE456");
  });
});
