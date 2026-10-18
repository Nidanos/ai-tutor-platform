const STORAGE_PREFIX = "ai-tutor-auth";

export function getStoredValue(key: string): string {
    try {
        return sessionStorage.getItem(`${STORAGE_PREFIX}-${key}`) ?? "";
    } catch {
        return "";
    }
}

export function storeValue(key: string, value: string): void {
    try {
        sessionStorage.setItem(`${STORAGE_PREFIX}-${key}`, value);
    } catch {
        // The form should still work if storage is unavailable.
    }
}

export function removeStoredValue(key: string): void {
    try {
        sessionStorage.removeItem(`${STORAGE_PREFIX}-${key}`);
    } catch {
        // Ignore storage errors.
    }
}

export function clearSignupData(): void {
  removeStoredValue("signup-name");
  removeStoredValue("signup-email");
}

export function clearLoginData(): void {
  removeStoredValue("login-email");
}