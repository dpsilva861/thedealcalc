# TheDealCalc Blog System

A simple blog system for TheDealCalc.com with admin posting capabilities.

## Features

- **Public Blog**: `/blog` lists posts, `/blog/[slug]` shows individual posts
- **Admin Panel**: `/admin/blog` for creating, editing, and publishing posts
- **Markdown Support**: Write posts in Markdown with live preview
- **RSS Feed**: Available at `/rss.xml`
- **SEO Ready**: Proper meta tags, Open Graph support

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses | Yes |

### Setting ADMIN_EMAILS

In the Lovable Cloud secrets, set `ADMIN_EMAILS` to a comma-separated list:

```
admin@example.com,editor@example.com
```

## How to Post

1. **Create an Admin User**: 
   - Go to your Lovable Cloud backend
   - Create a user with email/password authentication
   - Ensure the email is in `ADMIN_EMAILS`

2. **Access Admin Panel**:
   - Navigate to `/admin/login`
   - Sign in with your admin credentials
   - You'll be redirected to `/admin/blog`

3. **Create a Post**:
   - Click "New Post"
   - Fill in title, slug (auto-generates from title)
   - Write content in Markdown
   - Add tags (comma-separated)
   - Set posted date
   - Choose status: Draft or Published

4. **Preview & Publish**:
   - Use the Preview tab to see how it renders
   - Set status to "Published" to make it public
   - Click "Create Post" or "Update Post"

## Markdown Support

The blog supports:
- Headings (# H1, ## H2, etc.)
- **Bold** and *italic* text
- [Links](url)
- `inline code` and code blocks
- Bullet and numbered lists
- Block quotes (> quote)
- Tables
- Horizontal rules (---)

## Database Structure

The blog uses the `blog_posts` table with:
- `id` - UUID primary key
- `title` - Post title
- `slug` - URL-friendly identifier (unique)
- `excerpt` - Short summary for cards
- `body_markdown` - Full post content
- `tags` - Array of tag strings
- `posted_at` - Publication date
- `status` - 'draft' or 'published'
- `author_name` - Author display name
- `reading_time_minutes` - Auto-calculated
- `created_at`, `updated_at` - Timestamps

## Security

- Public can only read published posts
- Admin CRUD operations require authentication
- Admin status verified via `ADMIN_EMAILS` env var
- Edge functions use service role for database operations
- No secrets exposed to client

## Testing

1. Set `ADMIN_EMAILS` in secrets
2. Create a test user matching one of those emails
3. Log in at `/admin/login`
4. Create a draft post, verify it's not visible at `/blog`
5. Publish the post, verify it appears at `/blog` and `/blog/[slug]`
6. Test RSS feed at `/rss.xml`
