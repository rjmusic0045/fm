// Error codes thrown by the credentials provider and surfaced to the login form.
export const AUTH_ERRORS = {
  NO_ACCOUNT: "NO_ACCOUNT",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  OAUTH_ONLY: "OAUTH_ONLY",
  RATE_LIMITED: "RATE_LIMITED",
  INVALID_INPUT: "INVALID_INPUT",
  // Correct password, but the account is active on another device (resubmit with force to take over).
  ALREADY_SIGNED_IN: "ALREADY_SIGNED_IN",
  // Deactivated by an admin.
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
} as const;

export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS] | "BACKEND_UNAVAILABLE" | "UNKNOWN";

export const authErrorMessages: Record<AuthErrorCode, string> = {
  NO_ACCOUNT: "No account found for this email.",
  INVALID_CREDENTIALS: "Incorrect email or password.",
  OAUTH_ONLY: "This account uses Facebook to sign in. Use “Continue with Facebook” or reset your password to add one.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  INVALID_INPUT: "Please check your email and password.",
  ALREADY_SIGNED_IN: "This account is already signed in on another device.",
  ACCOUNT_DISABLED: "This account has been deactivated. Contact support if you think this is a mistake.",
  BACKEND_UNAVAILABLE: "Sign-in is temporarily unavailable. Please try again shortly.",
  UNKNOWN: "Something went wrong. Please try again.",
};

// A login counts as a duplicate if the other session was active this recently.
export const ACTIVE_SESSION_WINDOW_MS = 10 * 60 * 1000;
// How often a session re-checks that it is still the account's active one.
export const SESSION_RECHECK_MS = 60 * 1000;

// Session lifetimes (seconds).
export const SESSION_REMEMBER_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_SHORT_SECONDS = 24 * 60 * 60;
