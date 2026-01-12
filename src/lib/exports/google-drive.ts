/**
 * Google Drive Export
 * 
 * Handles OAuth flow and file uploads to Google Drive.
 * Creates Google Docs, Sheets, and Slides from calculator data.
 */

import { supabase } from '@/integrations/supabase/client';
import { CanonicalExportData, GoogleDriveExportResult } from './types';

// Google OAuth configuration
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

/**
 * Check if user has Google access token stored
 */
export function hasGoogleAuth(): boolean {
  const token = localStorage.getItem('google_access_token');
  const expiresAt = localStorage.getItem('google_token_expires');
  
  if (!token || !expiresAt) return false;
  
  return Date.now() < parseInt(expiresAt, 10);
}

/**
 * Get stored Google access token
 */
export function getGoogleAccessToken(): string | null {
  if (!hasGoogleAuth()) return null;
  return localStorage.getItem('google_access_token');
}

/**
 * Store Google access token
 */
export function storeGoogleAuth(accessToken: string, expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem('google_access_token', accessToken);
  localStorage.setItem('google_token_expires', expiresAt.toString());
}

/**
 * Clear Google auth tokens
 */
export function clearGoogleAuth(): void {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expires');
}

/**
 * Initiate Google OAuth flow
 * Returns a promise that resolves when auth is complete
 */
export async function initiateGoogleAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a popup for OAuth
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Call edge function to get OAuth URL
    supabase.functions.invoke('google-auth', {
      body: { action: 'get_auth_url' },
    }).then(({ data, error }) => {
      if (error || !data?.url) {
        console.error('Failed to get Google auth URL:', error);
        resolve(false);
        return;
      }
      
      const popup = window.open(
        data.url,
        'Google Sign In',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        console.error('Failed to open popup');
        resolve(false);
        return;
      }
      
      // Listen for message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'google_auth_success') {
          storeGoogleAuth(event.data.accessToken, event.data.expiresIn);
          window.removeEventListener('message', handleMessage);
          resolve(true);
        } else if (event.data.type === 'google_auth_error') {
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      }, 500);
    });
  });
}

/**
 * Export to Google Docs
 */
export async function exportToGoogleDocs(data: CanonicalExportData): Promise<GoogleDriveExportResult> {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    const authSuccess = await initiateGoogleAuth();
    if (!authSuccess) {
      return { success: false, error: 'Google authentication failed' };
    }
  }
  
  try {
    const { data: result, error } = await supabase.functions.invoke('google-drive-export', {
      body: {
        action: 'create_doc',
        accessToken: getGoogleAccessToken(),
        exportData: data,
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Export failed' };
  }
}

/**
 * Export to Google Sheets
 */
export async function exportToGoogleSheets(data: CanonicalExportData): Promise<GoogleDriveExportResult> {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    const authSuccess = await initiateGoogleAuth();
    if (!authSuccess) {
      return { success: false, error: 'Google authentication failed' };
    }
  }
  
  try {
    const { data: result, error } = await supabase.functions.invoke('google-drive-export', {
      body: {
        action: 'create_sheet',
        accessToken: getGoogleAccessToken(),
        exportData: data,
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Export failed' };
  }
}

/**
 * Export to Google Slides
 */
export async function exportToGoogleSlides(data: CanonicalExportData): Promise<GoogleDriveExportResult> {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    const authSuccess = await initiateGoogleAuth();
    if (!authSuccess) {
      return { success: false, error: 'Google authentication failed' };
    }
  }
  
  try {
    const { data: result, error } = await supabase.functions.invoke('google-drive-export', {
      body: {
        action: 'create_slides',
        accessToken: getGoogleAccessToken(),
        exportData: data,
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Export failed' };
  }
}
