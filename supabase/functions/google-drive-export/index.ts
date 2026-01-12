/**
 * Google Drive Export Edge Function
 * 
 * Handles creating Google Docs, Sheets, and Slides from calculator export data.
 * Uses the user's OAuth access token to create files in their Google Drive.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportMetric {
  label: string;
  value: string | number;
  format?: string;
}

interface ExportSection {
  title: string;
  type: string;
  data: ExportMetric[] | string;
}

interface ExportData {
  calculatorType: string;
  reportTitle: string;
  exportDate: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    dealName?: string;
  };
  keyMetrics: ExportMetric[];
  assumptions: ExportSection[];
  warnings: { message: string; severity: string }[];
  disclaimer: string;
  notes?: string;
}

/**
 * Create Google Doc from export data
 */
async function createGoogleDoc(accessToken: string, data: ExportData): Promise<{ fileId: string; webViewLink: string }> {
  // First create the document
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${data.reportTitle} - ${data.exportDate}`,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create document: ${error}`);
  }

  const doc = await createResponse.json();
  const documentId = doc.documentId;

  // Build content requests
  const requests: any[] = [];
  let currentIndex = 1;

  // Helper to add text
  const addText = (text: string, style?: any) => {
    const endIndex = currentIndex + text.length;
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text,
      },
    });
    if (style) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: currentIndex, endIndex },
          textStyle: style,
          fields: Object.keys(style).join(','),
        },
      });
    }
    currentIndex = endIndex;
  };

  // Add title
  addText(`${data.reportTitle}\n\n`, { bold: true, fontSize: { magnitude: 24, unit: 'PT' } });

  // Add address if present
  const addressLine = data.address
    ? [data.address.address, data.address.city, data.address.dealName].filter(Boolean).join(', ')
    : '';
  if (addressLine) {
    addText(`${addressLine}\n`, { fontSize: { magnitude: 14, unit: 'PT' } });
  }

  // Add date
  addText(`Report Date: ${data.exportDate}\n\n`, { fontSize: { magnitude: 10, unit: 'PT' }, foregroundColor: { color: { rgbColor: { red: 0.5, green: 0.5, blue: 0.5 } } } });

  // Add key metrics section
  addText('Key Metrics\n', { bold: true, fontSize: { magnitude: 16, unit: 'PT' } });
  for (const metric of data.keyMetrics) {
    addText(`${metric.label}: ${metric.value}\n`);
  }
  addText('\n');

  // Add warnings if any
  if (data.warnings.length > 0) {
    addText('Risk Flags\n', { bold: true, fontSize: { magnitude: 16, unit: 'PT' }, foregroundColor: { color: { rgbColor: { red: 0.8, green: 0.3, blue: 0.2 } } } });
    for (const warning of data.warnings) {
      addText(`• ${warning.message}\n`);
    }
    addText('\n');
  }

  // Add assumptions sections
  for (const section of data.assumptions) {
    addText(`${section.title}\n`, { bold: true, fontSize: { magnitude: 14, unit: 'PT' } });
    if (Array.isArray(section.data)) {
      for (const item of section.data as ExportMetric[]) {
        addText(`${item.label}: ${item.value}\n`);
      }
    } else {
      addText(`${section.data}\n`);
    }
    addText('\n');
  }

  // Add disclaimer
  addText('Disclaimer\n', { bold: true, fontSize: { magnitude: 12, unit: 'PT' } });
  addText(data.disclaimer, { fontSize: { magnitude: 9, unit: 'PT' }, italics: true, foregroundColor: { color: { rgbColor: { red: 0.5, green: 0.5, blue: 0.5 } } } });

  // Apply all updates
  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  // Get the web view link
  const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}?fields=webViewLink`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const fileData = await fileResponse.json();

  return {
    fileId: documentId,
    webViewLink: fileData.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Create Google Sheet from export data
 */
async function createGoogleSheet(accessToken: string, data: ExportData): Promise<{ fileId: string; webViewLink: string }> {
  // Prepare sheet data
  const values: string[][] = [];
  
  // Title row
  values.push([data.reportTitle]);
  values.push([`Report Date: ${data.exportDate}`]);
  values.push([]);
  
  // Key metrics
  values.push(['Key Metrics']);
  for (const metric of data.keyMetrics) {
    values.push([metric.label, String(metric.value)]);
  }
  values.push([]);
  
  // Warnings
  if (data.warnings.length > 0) {
    values.push(['Risk Flags']);
    for (const warning of data.warnings) {
      values.push([warning.message]);
    }
    values.push([]);
  }
  
  // Assumptions
  for (const section of data.assumptions) {
    values.push([section.title]);
    if (Array.isArray(section.data)) {
      for (const item of section.data as ExportMetric[]) {
        values.push([item.label, String(item.value)]);
      }
    }
    values.push([]);
  }
  
  // Disclaimer
  values.push(['Disclaimer']);
  values.push([data.disclaimer]);

  // Create spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `${data.reportTitle} - ${data.exportDate}`,
      },
      sheets: [{
        properties: { title: 'Analysis' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: values.map(row => ({
            values: row.map(cell => ({
              userEnteredValue: { stringValue: cell },
            })),
          })),
        }],
      }],
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create spreadsheet: ${error}`);
  }

  const sheet = await createResponse.json();
  const spreadsheetId = sheet.spreadsheetId;

  return {
    fileId: spreadsheetId,
    webViewLink: sheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Create Google Slides from export data
 */
async function createGoogleSlides(accessToken: string, data: ExportData): Promise<{ fileId: string; webViewLink: string }> {
  // Create presentation
  const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${data.reportTitle} - ${data.exportDate}`,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create presentation: ${error}`);
  }

  const presentation = await createResponse.json();
  const presentationId = presentation.presentationId;

  // Build slide requests
  const requests: any[] = [];

  // Delete default slide
  if (presentation.slides && presentation.slides.length > 0) {
    requests.push({
      deleteObject: { objectId: presentation.slides[0].objectId },
    });
  }

  // Create title slide
  const titleSlideId = 'title_slide';
  requests.push({
    createSlide: {
      objectId: titleSlideId,
      slideLayoutReference: { predefinedLayout: 'TITLE' },
    },
  });

  // Add title text
  requests.push({
    insertText: {
      objectId: `${titleSlideId}_title`,
      text: data.reportTitle,
    },
  });

  // Create metrics slide
  const metricsSlideId = 'metrics_slide';
  requests.push({
    createSlide: {
      objectId: metricsSlideId,
      slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
    },
  });

  // Apply updates
  await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  return {
    fileId: presentationId,
    webViewLink: `https://docs.google.com/presentation/d/${presentationId}/edit`,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, exportData } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!exportData) {
      return new Response(
        JSON.stringify({ error: 'Export data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { fileId: string; webViewLink: string };

    switch (action) {
      case 'create_doc':
        result = await createGoogleDoc(accessToken, exportData);
        break;
      case 'create_sheet':
        result = await createGoogleSheet(accessToken, exportData);
        break;
      case 'create_slides':
        result = await createGoogleSlides(accessToken, exportData);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[google-drive-export] Created ${action}: ${result.fileId}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[google-drive-export] Error:', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
