import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, LogOut, Loader2, ArrowLeft, FileText } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

interface Series {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number | null;
  post_count: number;
}

interface FormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  order_index?: number;
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  description: '',
  order_index: 0,
};

export default function AdminTaxonomy() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<FormData>(emptyForm);
  
  const [editingSeries, setEditingSeries] = useState(false);
  const [seriesForm, setSeriesForm] = useState<FormData>(emptyForm);

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

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;

      try {
        const [catsRes, seriesRes] = await Promise.all([
          supabase.functions.invoke('admin-blog', { body: { action: 'list_categories' } }),
          supabase.functions.invoke('admin-blog', { body: { action: 'list_series' } }),
        ]);

        if (catsRes.error) throw catsRes.error;
        if (seriesRes.error) throw seriesRes.error;

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  };

  // Category handlers
  const handleCreateCategory = () => {
    setCategoryForm(emptyForm);
    setEditingCategory(true);
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
    });
    setEditingCategory(true);
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (cat.post_count > 0) {
      toast.error('Cannot delete category with existing posts');
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'delete_category', id: cat.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setCategories(categories.filter(c => c.id !== cat.id));
      toast.success('Category deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      toast.error(message);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const action = categoryForm.id ? 'update_category' : 'create_category';
      const { data, error } = await supabase.functions.invoke('admin-blog', {
        body: {
          action,
          id: categoryForm.id,
          name: categoryForm.name,
          slug: categoryForm.slug || generateSlug(categoryForm.name),
          description: categoryForm.description || null,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(categoryForm.id ? 'Category updated' : 'Category created');

      // Refresh categories
      const { data: refreshed } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'list_categories' }
      });
      setCategories(refreshed?.categories || []);
      
      setEditingCategory(false);
      setCategoryForm(emptyForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      toast.error(message);
    }
    setSaving(false);
  };

  // Series handlers
  const handleCreateSeries = () => {
    setSeriesForm({ ...emptyForm, order_index: series.length });
    setEditingSeries(true);
  };

  const handleEditSeries = (s: Series) => {
    setSeriesForm({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description || '',
      order_index: s.order_index || 0,
    });
    setEditingSeries(true);
  };

  const handleDeleteSeries = async (s: Series) => {
    if (s.post_count > 0) {
      toast.error('Cannot delete series with existing posts');
      return;
    }
    if (!confirm(`Delete series "${s.name}"?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'delete_series', id: s.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setSeries(series.filter(item => item.id !== s.id));
      toast.success('Series deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete series';
      toast.error(message);
    }
  };

  const handleSaveSeries = async () => {
    if (!seriesForm.name) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const action = seriesForm.id ? 'update_series' : 'create_series';
      const { data, error } = await supabase.functions.invoke('admin-blog', {
        body: {
          action,
          id: seriesForm.id,
          name: seriesForm.name,
          slug: seriesForm.slug || generateSlug(seriesForm.name),
          description: seriesForm.description || null,
          order_index: seriesForm.order_index || 0,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(seriesForm.id ? 'Series updated' : 'Series created');

      // Refresh series
      const { data: refreshed } = await supabase.functions.invoke('admin-blog', {
        body: { action: 'list_series' }
      });
      setSeries(refreshed?.series || []);
      
      setEditingSeries(false);
      setSeriesForm(emptyForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save series';
      toast.error(message);
    }
    setSaving(false);
  };

  // Redirect to login if not authenticated (in useEffect to avoid navigate during render)
  useEffect(() => {
    if (!authLoading && !checkingAdmin && !user) {
      navigate('/admin/login');
    }
  }, [authLoading, checkingAdmin, user, navigate]);

  // Loading state
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Not logged in - render null while redirecting
  if (!user) {
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
        <title>Categories & Series | Blog Admin | TheDealCalc</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link to="/admin/blog">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Posts
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Categories & Series</h1>
              <p className="text-muted-foreground">Organize your blog content</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : (
            <Tabs defaultValue="categories">
              <TabsList className="mb-6">
                <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
                <TabsTrigger value="series">Series ({series.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="categories">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Categories</h2>
                  <Dialog open={editingCategory} onOpenChange={setEditingCategory}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreateCategory}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{categoryForm.id ? 'Edit Category' : 'New Category'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cat-name">Name *</Label>
                          <Input
                            id="cat-name"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="Category name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cat-slug">
                            Slug
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="ml-2 h-auto p-0"
                              onClick={() => setCategoryForm({ ...categoryForm, slug: generateSlug(categoryForm.name) })}
                            >
                              Generate
                            </Button>
                          </Label>
                          <Input
                            id="cat-slug"
                            value={categoryForm.slug}
                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                            placeholder="category-slug"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cat-desc">Description (optional)</Label>
                          <Textarea
                            id="cat-desc"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            placeholder="Brief description of this category"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => { setEditingCategory(false); setCategoryForm(emptyForm); }}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveCategory} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {categoryForm.id ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {categories.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No categories yet. Create your first category!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <Card key={cat.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{cat.name}</h3>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {cat.post_count} posts
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">/blog/category/{cat.slug}</p>
                              {cat.description && (
                                <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteCategory(cat)}
                                disabled={cat.post_count > 0}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="series">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Series</h2>
                  <Dialog open={editingSeries} onOpenChange={setEditingSeries}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreateSeries}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Series
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{seriesForm.id ? 'Edit Series' : 'New Series'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="series-name">Name *</Label>
                          <Input
                            id="series-name"
                            value={seriesForm.name}
                            onChange={(e) => setSeriesForm({ ...seriesForm, name: e.target.value })}
                            placeholder="Series name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="series-slug">
                            Slug
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="ml-2 h-auto p-0"
                              onClick={() => setSeriesForm({ ...seriesForm, slug: generateSlug(seriesForm.name) })}
                            >
                              Generate
                            </Button>
                          </Label>
                          <Input
                            id="series-slug"
                            value={seriesForm.slug}
                            onChange={(e) => setSeriesForm({ ...seriesForm, slug: e.target.value })}
                            placeholder="series-slug"
                          />
                        </div>
                        <div>
                          <Label htmlFor="series-desc">Description (optional)</Label>
                          <Textarea
                            id="series-desc"
                            value={seriesForm.description}
                            onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                            placeholder="Brief description of this series"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="series-order">Order Index</Label>
                          <Input
                            id="series-order"
                            type="number"
                            value={seriesForm.order_index}
                            onChange={(e) => setSeriesForm({ ...seriesForm, order_index: parseInt(e.target.value) || 0 })}
                            min={0}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => { setEditingSeries(false); setSeriesForm(emptyForm); }}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSeries} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {seriesForm.id ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {series.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No series yet. Create your first series!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {series.map((s) => (
                      <Card key={s.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{s.name}</h3>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {s.post_count} posts
                                </span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  Order: {s.order_index}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">/blog/series/{s.slug}</p>
                              {s.description && (
                                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSeries(s)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteSeries(s)}
                                disabled={s.post_count > 0}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}
