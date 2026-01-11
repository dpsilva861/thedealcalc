# TheDealCalc Blog System

A comprehensive blog system with search, categories, series, view tracking, and SEO optimization.

## Features

- **Full-text search** with Postgres tsvector
- **Categories & Series** for content organization
- **Featured posts** hero section
- **Reading progress** bar
- **Table of contents** with scrollspy
- **Related posts** via tag/category similarity
- **View tracking** with rate limiting
- **JSON-LD** structured data
- **RSS feed** via edge function
- **Sitemap** via edge function

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_EMAILS` | Comma-separated admin emails | Yes |
| `SITE_URL` | Public site URL for RSS/sitemap | Recommended |

## Database Tables

- `blog_posts` - Main posts with extended fields
- `blog_categories` - Post categories
- `blog_series` - Multi-part series
- `blog_post_redirects` - Slug redirects
- `blog_post_revisions` - Content history
- `blog_post_views` - Daily view counts
- `user_roles` - Secure role management

## Admin Workflow

1. Go to `/admin/login` and sign in
2. Navigate to `/admin/blog`
3. Create/edit posts with:
   - Title, slug, excerpt
   - Markdown content
   - Featured image upload
   - Category, series, tags
   - Difficulty level
   - SEO fields
   - Status (draft/published)

## Public Routes

- `/blog` - Index with search, filters, pagination
- `/blog/:slug` - Individual post
- `/blog/category/:slug` - Category archive
- `/blog/series/:slug` - Series archive

## Edge Functions

- `rss` - RSS feed at `/functions/v1/rss`
- `sitemap` - Sitemap at `/functions/v1/sitemap`
- `blog-track-view` - View counting with rate limiting
- `admin-blog` - Admin CRUD operations
- `check-admin` - Admin verification

## Test Checklist

- [ ] Create a draft post → verify not visible on /blog
- [ ] Publish the post → verify visible on /blog
- [ ] Search for post title → verify found
- [ ] Filter by category/tag → verify filtering works
- [ ] View post page → verify TOC, progress bar
- [ ] Check RSS feed works
- [ ] Check sitemap works
- [ ] Verify view count increments

## Known Limitations

- Scheduled publishing requires manual trigger (no cron)
- Comments system is not implemented
- Glossary feature is not implemented
- Revision history is stored but not exposed in UI
