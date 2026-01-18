/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at runtime.
 * Provides type-safe access to env vars.
 */

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_PROJECT_ID: string;
  IS_DEVELOPMENT: boolean;
}

function getEnvVar(key: string, required: boolean = false): string {
  const value = import.meta.env[key];
  
  if (required && (!value || value === 'undefined')) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    // Don't throw in production to avoid crashing the app
    if (import.meta.env.DEV) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return '';
  }
  
  return value || '';
}

/**
 * Validated environment configuration
 */
export const env: EnvConfig = {
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', true),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY', true),
  SUPABASE_PROJECT_ID: getEnvVar('VITE_SUPABASE_PROJECT_ID', false),
  IS_DEVELOPMENT: import.meta.env.DEV === true,
};

/**
 * Check if all required environment variables are configured
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
  const missing: string[] = [];
  
  for (const key of required) {
    const value = import.meta.env[key];
    if (!value || value === 'undefined') {
      missing.push(key);
    }
  }
  
  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn('[ENV] Missing environment variables:', missing);
  }
  
  return { valid: missing.length === 0, missing };
}

// Validate on module load (development only warning)
if (import.meta.env.DEV) {
  validateEnv();
}
