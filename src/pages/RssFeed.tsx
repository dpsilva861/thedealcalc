import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  body_markdown: string;
}

export default function RssFeed() {
  const [rssContent, setRssContent] = useState<string>('');
  
  useEffect(() => {
    async function generateRss() {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, posted_at, body_markdown')
        .eq('status', 'published')
        .order('posted_at', { ascending: false })
        .limit(20);

      const siteUrl = window.location.origin;
      const now = new Date().toUTCString();

      const items = (posts || []).map((post: BlogPost) => {
        const pubDate = post.posted_at ? new Date(post.posted_at).toUTCString() : now;
        const description = post.excerpt || post.body_markdown.slice(0, 200) + '...';
        
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
      }).join('');

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TheDealCalc Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Real estate investment insights, strategies, and analysis</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

      setRssContent(rss);

      // Set the content type for RSS
      const blob = new Blob([rss], { type: 'application/rss+xml' });
      const url = URL.createObjectURL(blob);
      window.location.href = url;
    }

    generateRss();
  }, []);

  // This component redirects to the RSS blob, but show loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Generating RSS feed...</p>
    </div>
  );
}
