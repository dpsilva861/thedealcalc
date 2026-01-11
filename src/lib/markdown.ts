// Simple markdown to HTML converter for blog posts
// Handles: headings, bold, italic, links, lists, code blocks, blockquotes, tables

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
  
  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6 class="text-base font-semibold mt-6 mb-2">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="text-lg font-semibold mt-6 mb-2">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-xl font-semibold mt-6 mb-3">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-2xl font-semibold mt-8 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-4xl font-bold mt-8 mb-4">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
  
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
  
  return html;
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
