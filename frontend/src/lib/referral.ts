const REFERRAL_COOKIE_NAME = "rr_invite";
const REFERRAL_COOKIE_TTL_DAYS = 30;

function isSecureContextForCookie() {
  return window.location.protocol === "https:";
}

export function isValidInviteCode(inviteCode: string | null | undefined) {
  return Boolean(inviteCode && /^[A-Z0-9]{6,32}$/i.test(inviteCode.trim()));
}

export function getReferralCookieValue() {
  const cookies = document.cookie.split(";").map((item) => item.trim());
  const prefix = `${REFERRAL_COOKIE_NAME}=`;
  const match = cookies.find((item) => item.startsWith(prefix));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.slice(prefix.length));
}

export function setReferralCookie(inviteCode: string) {
  const normalized = inviteCode.trim().toUpperCase();
  const expires = new Date();
  expires.setDate(expires.getDate() + REFERRAL_COOKIE_TTL_DAYS);
  const secure = isSecureContextForCookie() ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${secure}`;
}

export function captureReferralInvite(inviteCode: string | null | undefined) {
  if (!isValidInviteCode(inviteCode)) {
    return null;
  }
  const normalized = inviteCode!.trim().toUpperCase();
  setReferralCookie(normalized);
  return normalized;
}
