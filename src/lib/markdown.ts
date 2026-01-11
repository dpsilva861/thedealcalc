// Enhanced markdown to HTML converter for blog posts
// Handles: headings with IDs, bold, italic, links, lists, code blocks, blockquotes, tables
// Includes XSS sanitization

import DOMPurify from 'dompurify';

// Safe URL protocols - blocks javascript:, data:, vbscript:, etc.
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|tel):\/\/|\/|#)/i;

function sanitizeUrl(url: string): string {
  const trimmedUrl = url.trim();
  
  // Allow relative URLs starting with / or #
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#')) {
    return trimmedUrl;
  }
  
  // Allow safe protocols
  if (SAFE_URL_PATTERN.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // Block everything else (javascript:, data:, vbscript:, etc.)
  console.warn(`Blocked potentially unsafe URL: ${trimmedUrl}`);
  return '#';
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Escape HTML entities first (but preserve our markdown)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Code blocks (``` ... ```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">${code.trim()}</code></pre>`;
  });
  
  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');
  
  // Tables
  html = html.replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm, (_, header, body) => {
    const headers = header.split('|').filter((h: string) => h.trim());
    const rows = body.trim().split('\n').map((row: string) => 
      row.split('|').filter((c: string) => c.trim())
    );
    
    let table = '<table class="w-full border-collapse my-4">';
    table += '<thead><tr class="border-b border-border">';
    headers.forEach((h: string) => {
      table += `<th class="text-left p-2 font-semibold">${h.trim()}</th>`;
    });
    table += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      table += '<tr class="border-b border-border">';
      row.forEach((cell: string) => {
        table += `<td class="p-2">${cell.trim()}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>');
  
  // Headers with IDs for TOC linking
  const generateId = (text: string) => text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  
  html = html.replace(/^###### (.+)$/gm, (_, text) => 
    `<h6 id="${generateId(text)}" class="text-base font-semibold mt-6 mb-2 scroll-mt-20">${text}</h6>`);
  html = html.replace(/^##### (.+)$/gm, (_, text) => 
    `<h5 id="${generateId(text)}" class="text-lg font-semibold mt-6 mb-2 scroll-mt-20">${text}</h5>`);
  html = html.replace(/^#### (.+)$/gm, (_, text) => 
    `<h4 id="${generateId(text)}" class="text-xl font-semibold mt-6 mb-3 scroll-mt-20">${text}</h4>`);
  html = html.replace(/^### (.+)$/gm, (_, text) => 
    `<h3 id="${generateId(text)}" class="text-2xl font-semibold mt-8 mb-3 scroll-mt-20">${text}</h3>`);
  html = html.replace(/^## (.+)$/gm, (_, text) => 
    `<h2 id="${generateId(text)}" class="text-3xl font-bold mt-8 mb-4 scroll-mt-20">${text}</h2>`);
  html = html.replace(/^# (.+)$/gm, (_, text) => 
    `<h1 id="${generateId(text)}" class="text-4xl font-bold mt-8 mb-4 scroll-mt-20">${text}</h1>`);
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Links - sanitize URLs to prevent XSS
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = sanitizeUrl(url);
    // Add security attributes for external links
    const isExternal = safeUrl.startsWith('http');
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeUrl}" class="text-primary hover:underline"${attrs}>${text}</a>`;
  });
  
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-4 space-y-1">$&</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />');
  
  // Paragraphs (wrap remaining text blocks)
  html = html.replace(/^(?!<[a-z])((?!<\/?(h[1-6]|ul|ol|li|pre|blockquote|table|thead|tbody|tr|th|td|hr)).+)$/gm, '<p class="my-4 leading-relaxed">$1</p>');
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="my-4 leading-relaxed"><\/p>/g, '');
  
  // Final DOMPurify sanitization with strict allowlist
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i',
      'a',
      'code', 'pre',
      'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title',
      'class', 'id',
      'loading'
    ],
    ALLOW_DATA_ATTR: false,
    // Block javascript: and data: URLs
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):\/\/|\/|#)/i
  });
  
  return sanitizedHtml;
}

export function estimateReadingTime(markdown: string): number {
  if (!markdown) return 1;
  const words = markdown.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function generateExcerpt(markdown: string, maxLength: number = 160): string {
  if (!markdown) return '';
  // Remove markdown syntax
  const text = markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^[\-\*]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// Test helper for development - validates XSS payloads are neutralized
export function testXssSanitization(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  const testCases = [
    { input: '[click me](javascript:alert(1))', shouldNotContain: 'javascript:' },
    { input: '[click me](data:text/html,<script>alert(1)</script>)', shouldNotContain: 'data:' },
    { input: '<img src=x onerror=alert(1)>', shouldNotContain: 'onerror' },
    { input: '<script>alert(1)</script>', shouldNotContain: '<script>' },
    { input: '[safe](https://example.com)', shouldContain: 'https://example.com' },
    { input: '[relative](/page)', shouldContain: 'href="/page"' },
    { input: '[anchor](#section)', shouldContain: 'href="#section"' },
  ];

  for (const tc of testCases) {
    const output = markdownToHtml(tc.input);
    if (tc.shouldNotContain && output.includes(tc.shouldNotContain)) {
      results.push(`FAIL: "${tc.input}" should NOT contain "${tc.shouldNotContain}"`);
      passed = false;
    } else if (tc.shouldContain && !output.includes(tc.shouldContain)) {
      results.push(`FAIL: "${tc.input}" should contain "${tc.shouldContain}"`);
      passed = false;
    } else {
      results.push(`PASS: "${tc.input}"`);
    }
  }

  return { passed, results };
}
