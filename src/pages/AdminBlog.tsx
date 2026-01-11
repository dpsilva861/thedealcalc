import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MarkdownContent } from '@/components/blog/MarkdownContent';
import { estimateReadingTime } from '@/lib/markdown';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Trash2, LogOut, Loader2, Upload, X, Image, AlertTriangle, History, Folder, Star } from 'lucide-react';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogSeries {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  posted_at: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
  status: string;
  author_name: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category_id: string | null;
  series_id: string | null;
  series_order: number | null;
  difficulty: string | null;
  property_type: string | null;
  featured: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  view_count_total: number | null;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory | null;
  blog_series?: BlogSeries | null;
}

interface PostForm {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body_markdown: string;
  tags: string;
  posted_at: string;
  status: 'draft' | 'published';
  author_name: string;
  featured_image_url: string;
  featured_image_alt: string;
  category_id: string;
  series_id: string;
  series_order: number;
  difficulty: string;
  property_type: string;
  featured: boolean;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  og_image_url: string;
}

interface LintWarning {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

interface Revision {
  id: string;
  post_id: string;
  title: string;
  body_markdown: string;
  excerpt: string | null;
  created_at: string;
  updated_by: string | null;
}

const emptyForm: PostForm = {
  title: '',
  slug: '',
  excerpt: '',
  body_markdown: '',
  tags: '',
  posted_at: new Date().toISOString().split('T')[0],
  status: 'draft',
  author_name: 'TheDealCalc Team',
  featured_image_url: '',
  featured_image_alt: '',
  category_id: '',
  series_id: '',
  series_order: 0,
  difficulty: '',
  property_type: '',
  featured: false,
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  og_image_url: '',
};

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'office', label: 'Office' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'general', label: 'General' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

export default function AdminBlog() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [series, setSeries] = useState<BlogSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [originalSlug, setOriginalSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lintWarnings, setLintWarnings] = useState<LintWarning[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!user?.email) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-admin', {
          body: { email: user.email }
        });

        if (error) throw error;
        setIsAdmin(data?.isAdmin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    }

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  // Fetch posts, categories, and series
  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;

      try {
        const [postsRes, catsRes, seriesRes] = await Promise.all([
          supabase.functions.invoke('admin-blog', { body: { action: 'list' } }),
          supabase.functions.invoke('admin-blog', { body: { action: 'list_categories' } }),
          supabase.functions.invoke('admin-blog', { body: { action: 'list_series' } }),
        ]);

        if (postsRes.error) throw postsRes.error;
        if (catsRes.error) throw catsRes.error;
        if (seriesRes.error) throw seriesRes.error;

        setPosts(postsRes.data?.posts || []);
        setCategories(catsRes.data?.categories || []);
        setSeries(seriesRes.data?.series || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data');
      }
      setLoading(false);
    }

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const runLintChecks = (formData: PostForm, isPublish = false): LintWarning[] => {
    const warnings: LintWarning[] = [];

    // Required checks
    if (!formData.title) {
      warnings.push({ field: 'title', message: 'Title is required', severity: 'error' });
    }
    if (!formData.slug) {
      warnings.push({ field: 'slug', message: 'Slug is required', severity: 'error' });
    }
    if (!formData.body_markdown) {
      warnings.push({ field: 'body_markdown', message: 'Content is required', severity: 'error' });
    }

    // Publish-specific checks
    if (isPublish || formData.status === 'published') {
      if (!formData.excerpt) {
        warnings.push({ field: 'excerpt', message: 'Excerpt is required for publishing', severity: 'error' });
      }
      if (!formData.featured_image_url) {
        warnings.push({ field: 'featured_image_url', message: 'Featured image recommended for publishing', severity: 'warning' });
      }
      if (formData.featured_image_url && !formData.featured_image_alt) {
        warnings.push({ field: 'featured_image_alt', message: 'Alt text is required for featured image', severity: 'error' });
      }
    }

    // Content quality checks
    const h2Count = (formData.body_markdown.match(/^##\s/gm) || []).length;
    if (h2Count === 0 && formData.body_markdown.length > 500) {
      warnings.push({ field: 'body_markdown', message: 'Consider adding H2 headings (##) for better structure', severity: 'warning' });
    }

    // Broken link detection (basic)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(formData.body_markdown)) !== null) {
      const url = match[2];
      if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#') && !url.startsWith('mailto:')) {
        warnings.push({ field: 'body_markdown', message: `Potentially invalid link: ${url}`, severity: 'warning' });
      }
    }

    return warnings;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleCreateNew = () => {
    setForm(emptyForm);
    setOriginalSlug('');
    setEditing(true);
    setPreviewMode(false);
    setLintWarnings([]);
    setRevisions([]);
  };

  const handleEdit = async (post: BlogPost) => {
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      body_markdown: post.body_markdown,
      tags: post.tags?.join(', ') || '',
      posted_at: post.posted_at ? new Date(post.posted_at).toISOString().split('T')[0] : '',
      status: post.status as 'draft' | 'published',
      author_name: post.author_name || 'TheDealCalc Team',
      featured_image_url: post.featured_image_url || '',
      featured_image_alt: post.featured_image_alt || '',
      category_id: post.category_id || '',
      series_id: post.series_id || '',
      series_order: post.series_order || 0,
      difficulty: post.difficulty || '',
      property_type: post.property_type || '',
      featured: post.featured || false,
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      canonical_url: post.canonical_url || '',
      og_image_url: post.og_image_url || '',
    });
    setOriginalSlug(post.slug);
    setEditing(true);
    setPreviewMode(false);
    setLintWarnings([]);

    // Fetch revisions
    try {
      const { data, error } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'get_revisions', id: post.id }
      });
      if (!error && data?.revisions) {
        setRevisions(data.revisions);
      }
    } catch (err) {
      console.error('Error fetching revisions:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'delete', id }
      });

      if (error) throw error;
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `featured/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setForm({ ...form, featured_image_url: publicUrl });
      toast.success('Image uploaded');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    }
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, featured_image_url: '', featured_image_alt: '' });
  };

  const handleCopyFeaturedToOG = () => {
    if (form.featured_image_url) {
      setForm({ ...form, og_image_url: form.featured_image_url });
      toast.success('OG image set from featured image');
    }
  };

  const handleRestoreRevision = (revision: Revision) => {
    if (!confirm('Restore this revision? Current changes will be lost.')) return;
    
    setForm({
      ...form,
      title: revision.title,
      body_markdown: revision.body_markdown,
      excerpt: revision.excerpt || '',
    });
    setSelectedRevision(null);
    setShowRevisions(false);
    toast.success('Revision restored');
  };

  const handleSave = async (publishOverride?: boolean) => {
    const targetStatus = publishOverride ? 'published' : form.status;
    const isPublishing = targetStatus === 'published';
    
    const warnings = runLintChecks({ ...form, status: targetStatus as 'draft' | 'published' }, isPublishing);
    setLintWarnings(warnings);

    const errors = warnings.filter(w => w.severity === 'error');
    if (errors.length > 0) {
      toast.error(`Cannot save: ${errors[0].message}`);
      return;
    }

    if (isPublishing && warnings.length > 0) {
      const proceed = confirm(`There are ${warnings.length} warning(s). Continue publishing?`);
      if (!proceed) return;
    }

    setSaving(true);
    try {
      const payload = {
        action: form.id ? 'update' : 'create',
        id: form.id,
        title: form.title,
        slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        excerpt: form.excerpt || null,
        body_markdown: form.body_markdown,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        posted_at: form.posted_at || null,
        status: targetStatus,
        author_name: form.author_name || 'TheDealCalc Team',
        reading_time_minutes: estimateReadingTime(form.body_markdown),
        featured_image_url: form.featured_image_url || null,
        featured_image_alt: form.featured_image_alt || null,
        category_id: form.category_id || null,
        series_id: form.series_id || null,
        series_order: form.series_order || 0,
        difficulty: form.difficulty || null,
        property_type: form.property_type || null,
        featured: form.featured,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        canonical_url: form.canonical_url || null,
        og_image_url: form.og_image_url || null,
      };

      const { error } = await supabase.functions.invoke('admin-blog', {
        body: payload
      });

      if (error) throw error;

      toast.success(form.id ? 'Post updated' : 'Post created');
      
      // Refresh posts
      const { data: refreshedData } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'list' }
      });
      setPosts(refreshedData?.posts || []);
      
      setEditing(false);
      setForm(emptyForm);
      setOriginalSlug('');
    } catch (err: unknown) {
      console.error('Error saving post:', err);
      const message = err instanceof Error ? err.message : 'Failed to save post';
      toast.error(message);
    }
    setSaving(false);
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    setForm({ ...form, slug });
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (filterCategory !== 'all' && post.category_id !== filterCategory) return false;
    if (filterFeatured === 'featured' && !post.featured) return false;
    if (filterFeatured === 'not_featured' && post.featured) return false;
    return true;
  });

  // Loading state
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    navigate('/admin/login');
    return null;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin area.
            </p>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Blog Admin | TheDealCalc</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Blog Admin</h1>
              <p className="text-muted-foreground">Manage your blog posts</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin/blog/taxonomy">
                <Button variant="outline" size="sm">
                  <Folder className="h-4 w-4 mr-2" />
                  Categories & Series
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {editing ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{form.id ? 'Edit Post' : 'New Post'}</CardTitle>
                {form.id && revisions.length > 0 && (
                  <Dialog open={showRevisions} onOpenChange={setShowRevisions}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        Revisions ({revisions.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Revision History</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {revisions.map((rev) => (
                          <div key={rev.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-muted-foreground">
                                {new Date(rev.created_at).toLocaleString()}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedRevision(rev)}
                                >
                                  View
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleRestoreRevision(rev)}
                                >
                                  Restore
                                </Button>
                              </div>
                            </div>
                            <div className="font-medium truncate">{rev.title}</div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {/* Lint Warnings */}
                {lintWarnings.length > 0 && (
                  <div className="mb-6 p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Content Warnings</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {lintWarnings.map((w, i) => (
                        <li key={i} className={w.severity === 'error' ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-400'}>
                          • {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Slug Change Warning */}
                {form.id && originalSlug && form.slug !== originalSlug && (
                  <div className="mb-6 p-4 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      ⓘ Changing slug will create an automatic redirect from <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/blog/{originalSlug}</code> to the new URL.
                    </p>
                  </div>
                )}

                <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(v) => setPreviewMode(v === 'preview')}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="edit" className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="Post title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">
                          Slug *
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="ml-2 h-auto p-0"
                            onClick={generateSlug}
                          >
                            Generate from title
                          </Button>
                        </Label>
                        <Input
                          id="slug"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          placeholder="post-url-slug"
                        />
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div>
                      <Label>Featured Image</Label>
                      {form.featured_image_url ? (
                        <div className="mt-2 space-y-2">
                          <div className="relative inline-block">
                            <img 
                              src={form.featured_image_url} 
                              alt={form.featured_image_alt || 'Featured'} 
                              className="h-32 w-auto rounded-lg object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="featured_image_alt">Alt Text *</Label>
                            <Input
                              id="featured_image_alt"
                              value={form.featured_image_alt}
                              onChange={(e) => setForm({ ...form, featured_image_alt: e.target.value })}
                              placeholder="Describe this image for accessibility"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="featured-image"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max 5MB. JPG, PNG, WebP only.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Excerpt */}
                    <div>
                      <Label htmlFor="excerpt">Excerpt (required for publishing)</Label>
                      <Textarea
                        id="excerpt"
                        value={form.excerpt}
                        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                        placeholder="Brief summary of the post"
                        rows={2}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <Label htmlFor="body">Content (Markdown) *</Label>
                      <Textarea
                        id="body"
                        value={form.body_markdown}
                        onChange={(e) => setForm({ ...form, body_markdown: e.target.value })}
                        placeholder="Write your post content in Markdown..."
                        rows={15}
                        className="font-mono"
                      />
                    </div>

                    {/* Category & Series */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Series</Label>
                        <Select value={form.series_id} onValueChange={(v) => setForm({ ...form, series_id: v === 'none' ? '' : v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select series" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {series.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {form.series_id && (
                        <div>
                          <Label htmlFor="series_order">Series Order</Label>
                          <Input
                            id="series_order"
                            type="number"
                            value={form.series_order}
                            onChange={(e) => setForm({ ...form, series_order: parseInt(e.target.value) || 0 })}
                            min={0}
                          />
                        </div>
                      )}
                    </div>

                    {/* Difficulty & Property Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Difficulty</Label>
                        <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v === 'none' ? '' : v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {DIFFICULTY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Property Type</Label>
                        <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v === 'none' ? '' : v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {PROPERTY_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags & Author */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={form.tags}
                          onChange={(e) => setForm({ ...form, tags: e.target.value })}
                          placeholder="investing, BRRRR, analysis"
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={form.author_name}
                          onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                          placeholder="Author name"
                        />
                      </div>
                    </div>

                    {/* Posted Date & Status & Featured */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="posted_at">Posted Date</Label>
                        <Input
                          id="posted_at"
                          type="date"
                          value={form.posted_at}
                          onChange={(e) => setForm({ ...form, posted_at: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={form.status} 
                          onValueChange={(v: 'draft' | 'published') => setForm({ ...form, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch
                          id="featured"
                          checked={form.featured}
                          onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
                        />
                        <Label htmlFor="featured" className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Featured
                        </Label>
                      </div>
                    </div>

                    {/* SEO Fields */}
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">SEO Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="seo_title">SEO Title (optional)</Label>
                          <Input
                            id="seo_title"
                            value={form.seo_title}
                            onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                            placeholder="Custom title for search engines"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Leave blank to use post title</p>
                        </div>
                        <div>
                          <Label htmlFor="canonical_url">Canonical URL (optional)</Label>
                          <Input
                            id="canonical_url"
                            value={form.canonical_url}
                            onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="seo_description">SEO Description (optional)</Label>
                        <Textarea
                          id="seo_description"
                          value={form.seo_description}
                          onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                          placeholder="Custom description for search engines"
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Leave blank to use excerpt</p>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="og_image_url">OG Image URL (optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="og_image_url"
                            value={form.og_image_url}
                            onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
                            placeholder="https://..."
                          />
                          {form.featured_image_url && !form.og_image_url && (
                            <Button type="button" variant="outline" onClick={handleCopyFeaturedToOG}>
                              <Image className="h-4 w-4 mr-2" />
                              Use Featured
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="border rounded-lg p-6">
                      <p className="text-muted-foreground mb-4">
                        Posted: {form.posted_at ? new Date(form.posted_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Not dated'}
                      </p>
                      <h1 className="text-3xl font-bold mb-4">{form.title || 'Untitled'}</h1>
                      {form.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {form.tags.split(',').map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag.trim()}</Badge>
                          ))}
                        </div>
                      )}
                      {form.featured_image_url && (
                        <img 
                          src={form.featured_image_url} 
                          alt={form.featured_image_alt || 'Featured'} 
                          className="w-full h-auto rounded-lg mb-6 max-h-96 object-cover"
                        />
                      )}
                      <MarkdownContent content={form.body_markdown} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                  <Button variant="outline" onClick={() => { setEditing(false); setForm(emptyForm); setOriginalSlug(''); }}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save as {form.status === 'published' ? 'Published' : 'Draft'}
                  </Button>
                  {form.status !== 'published' && (
                    <Button onClick={() => handleSave(true)} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Publish Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterFeatured} onValueChange={setFilterFeatured}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="not_featured">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {posts.length === 0 ? 'No posts yet. Create your first post!' : 'No posts match the current filters.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {post.featured_image_url ? (
                              <img 
                                src={post.featured_image_url} 
                                alt="" 
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                <Image className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{post.title}</h3>
                                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                  {post.status}
                                </Badge>
                                {post.featured && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                /blog/{post.slug}
                                {post.blog_categories && <span> • {post.blog_categories.name}</span>}
                                {post.blog_series && <span> • {post.blog_series.name}</span>}
                                {post.posted_at && <span> • {new Date(post.posted_at).toLocaleDateString()}</span>}
                                {post.view_count_total !== null && post.view_count_total > 0 && (
                                  <span> • {post.view_count_total} views</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.status === 'published' && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Revision View Modal */}
      <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision from {selectedRevision && new Date(selectedRevision.created_at).toLocaleString()}</DialogTitle>
          </DialogHeader>
          {selectedRevision && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <p className="p-2 bg-muted rounded">{selectedRevision.title}</p>
              </div>
              <div>
                <Label>Excerpt</Label>
                <p className="p-2 bg-muted rounded">{selectedRevision.excerpt || '(empty)'}</p>
              </div>
              <div>
                <Label>Content</Label>
                <pre className="p-2 bg-muted rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {selectedRevision.body_markdown}
                </pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedRevision(null)}>Close</Button>
                <Button onClick={() => handleRestoreRevision(selectedRevision)}>Restore This Version</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
