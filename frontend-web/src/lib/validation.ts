/**
 * FILE: src/lib/validation.ts
 *
 * Lightweight, dependency-free form validation helpers
 * used by the login and register pages.
 */

export interface ValidationError {
  [field: string]: string;
}

// ─── Validators ───────────────────────────────────────────────────────────────

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8;

// ─── Login validation ─────────────────────────────────────────────────────────

export interface LoginFields {
  email: string;
  password: string;
}

export const validateLogin = (fields: LoginFields): ValidationError => {
  const errors: ValidationError = {};

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  }

  return errors;
};

// ─── Register validation ──────────────────────────────────────────────────────

export interface RegisterFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateRegister = (fields: RegisterFields): ValidationError => {
  const errors: ValidationError = {};

  if (!fields.name.trim()) {
    errors.name = "Full name is required.";
  } else if (fields.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (!isStrongPassword(fields.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};
