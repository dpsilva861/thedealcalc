import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MarkdownContent } from '@/components/blog/MarkdownContent';
import { estimateReadingTime } from '@/lib/markdown';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Trash2, LogOut, Loader2 } from 'lucide-react';

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
  created_at: string;
  updated_at: string;
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
};

export default function AdminBlog() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

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

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      if (!isAdmin) return;

      try {
        const { data, error } = await supabase.functions.invoke('admin-blog', {
          body: { action: 'list' }
        });

        if (error) throw error;
        setPosts(data?.posts || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
        toast.error('Failed to load posts');
      }
      setLoading(false);
    }

    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleCreateNew = () => {
    setForm(emptyForm);
    setEditing(true);
    setPreviewMode(false);
  };

  const handleEdit = (post: BlogPost) => {
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
    });
    setEditing(true);
    setPreviewMode(false);
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

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.body_markdown) {
      toast.error('Title, slug, and content are required');
      return;
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
        status: form.status,
        author_name: form.author_name || 'TheDealCalc Team',
        reading_time_minutes: estimateReadingTime(form.body_markdown),
      };

      const { data, error } = await supabase.functions.invoke('admin-blog', {
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
    } catch (err) {
      console.error('Error saving post:', err);
      toast.error('Failed to save post');
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
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>{form.id ? 'Edit Post' : 'New Post'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(v) => setPreviewMode(v === 'preview')}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="edit" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="Post title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">
                          Slug
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

                    <div>
                      <Label htmlFor="excerpt">Excerpt (optional)</Label>
                      <Textarea
                        id="excerpt"
                        value={form.excerpt}
                        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                        placeholder="Brief summary of the post"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="body">Content (Markdown)</Label>
                      <Textarea
                        id="body"
                        value={form.body_markdown}
                        onChange={(e) => setForm({ ...form, body_markdown: e.target.value })}
                        placeholder="Write your post content in Markdown..."
                        rows={15}
                        className="font-mono"
                      />
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <MarkdownContent content={form.body_markdown} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                  <Button variant="outline" onClick={() => { setEditing(false); setForm(emptyForm); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {form.id ? 'Update Post' : 'Create Post'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{post.title}</h3>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              /blog/{post.slug} • {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'No date'}
                            </p>
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
    </>
  );
}
