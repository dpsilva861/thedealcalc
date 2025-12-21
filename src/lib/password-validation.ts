/**
 * Password Validation Utilities
 * 
 * Client-side validation that mirrors Supabase Auth backend requirements.
 * Backend enforcement is authoritative - this is for UX only.
 */

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: PasswordRequirement[];
  errorMessage: string | null;
}

// Allowed symbols for password
const ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};\\':\"|<>?,./`~";
const SYMBOL_REGEX = /[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/;

/**
 * Validate password against all security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "One uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "One number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "One symbol (!@#$%^&* etc.)",
      met: SYMBOL_REGEX.test(password),
    },
  ];

  const unmetRequirements = requirements.filter((r) => !r.met);
  const isValid = unmetRequirements.length === 0;

  let errorMessage: string | null = null;
  if (!isValid) {
    if (password.length === 0) {
      errorMessage = "Please enter a password.";
    } else if (unmetRequirements.length === requirements.length) {
      errorMessage = "Your password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.";
    } else {
      const missing = unmetRequirements.map((r) => r.label.toLowerCase()).join(", ");
      errorMessage = `Your password is missing: ${missing}.`;
    }
  }

  return {
    isValid,
    requirements,
    errorMessage,
  };
}

/**
 * Parse Supabase Auth error and return user-friendly message
 */
export function parsePasswordError(error: Error | null): string {
  if (!error) return "";

  const message = error.message.toLowerCase();

  // Leaked password detection
  if (
    message.includes("leaked") ||
    message.includes("pwned") ||
    message.includes("compromised") ||
    message.includes("breach")
  ) {
    return "This password has appeared in a data breach and cannot be used. Please choose a different password.";
  }

  // Weak password
  if (
    message.includes("weak") ||
    message.includes("strength") ||
    message.includes("too short") ||
    message.includes("requirements")
  ) {
    return "Your password is too weak. Please choose a password that meets all security requirements.";
  }

  // Already registered
  if (message.includes("already registered") || message.includes("already exists")) {
    return "This email is already registered. Please sign in instead.";
  }

  // Invalid credentials
  if (message.includes("invalid") && message.includes("credentials")) {
    return "Invalid email or password. Please try again.";
  }

  // Rate limiting
  if (message.includes("rate") || message.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Default
  return error.message;
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const { requirements } = validatePassword(password);
  const metCount = requirements.filter((r) => r.met).length;

  if (password.length === 0) {
    return { score: 0, label: "", color: "" };
  }

  if (metCount <= 1) {
    return { score: 1, label: "Weak", color: "bg-destructive" };
  }

  if (metCount <= 3) {
    return { score: 2, label: "Fair", color: "bg-orange-500" };
  }

  if (metCount <= 4) {
    return { score: 3, label: "Good", color: "bg-yellow-500" };
  }

  // All requirements met
  if (password.length >= 12) {
    return { score: 4, label: "Strong", color: "bg-primary" };
  }

  return { score: 4, label: "Good", color: "bg-primary" };
}
