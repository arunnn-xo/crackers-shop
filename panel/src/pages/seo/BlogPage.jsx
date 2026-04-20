import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, LoaderCircle, PenTool, Plus, RefreshCcw, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiRequest, getAssetUrl } from '../../lib/api';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BlogPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadBlogs = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const response = await apiRequest('/settings/blogs');
        setBlogs(response.data || []);
      } catch (error) {
        const nextMessage = error.message || 'Unable to load blogs.';
        setErrorMessage(nextMessage);
        addToast(nextMessage, 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadBlogs({ showLoader: true });
  }, [loadBlogs]);

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(`Delete blog "${blog.meta_title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingId(blog.id);
      await apiRequest(`/settings/blogs/${blog.id}`, {
        method: 'DELETE',
      });
      addToast('Blog deleted successfully.');
      await loadBlogs();
    } catch (error) {
      addToast(error.message || 'Unable to delete blog.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const tableRows = useMemo(
    () =>
      blogs.map((blog, index) => ({
        ...blog,
        serial: index + 1,
        publishedLabel: formatDateTime(blog.published_at || blog.created_at),
        metaDescriptionShort: blog.meta_description || '-',
        blogName: blog.title || '-',
        contentPreview: stripHtml(blog.content || ''),
      })),
    [blogs]
  );

  const columns = useMemo(
    () => [
      {
        key: 'serial',
        label: 'S.NO',
        render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'meta_title',
        label: 'Meta Title',
        render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'blogName',
        label: 'Blog Name',
        render: (value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'publishedLabel',
        label: 'Published',
        render: (value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/seo/blog/${row.id}/edit`)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title="Edit blog"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              disabled={isDeletingId === row.id}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title="Delete blog"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [isDeletingId, navigate]
  );

  const renderExpandedRow = (row) => (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
        <div className="flex aspect-[13/10] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
          {row.image ? (
            <img src={getAssetUrl(row.image)} alt={row.blogName} className="h-full w-full object-cover" />
          ) : (
            <span className="px-4 text-center text-xs text-slate-400 dark:text-slate-500">No image uploaded</span>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Blog Name</p>
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{row.blogName}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Published</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{row.publishedLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Meta Description</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{row.metaDescriptionShort}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Meta Key</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{row.meta_keywords || '-'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2 dark:border-white/10 dark:bg-[#0f0f15]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Feet Content Preview</p>
          <p className="mt-2 line-clamp-4 text-sm text-slate-700 dark:text-slate-300">{row.contentPreview || '-'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Blog Management"
        icon={PenTool}
        subtitle="Manage SEO-friendly blog posts with metadata, cover images, and rich content."
        badge={`${blogs.length} posts`}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" icon={RefreshCcw} onClick={() => loadBlogs()} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={() => navigate('/seo/blog/new')}>
              Add Blog
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading blogs...</span>
          </div>
        </div>
      ) : errorMessage && tableRows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load blogs</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <Button onClick={() => loadBlogs({ showLoader: true })}>Retry</Button>
          </div>
        </Card>
      ) : tableRows.length === 0 ? (
        <Card>
          <div className="space-y-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No blogs added yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add the first blog post to manage search metadata and rich article content here.
              </p>
            </div>
            <div className="flex justify-center">
              <Button icon={Plus} onClick={() => navigate('/seo/blog/new')}>
                Add Blog
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={tableRows}
            exportVariant="buttons"
            showColumnVisibility
            exportFileName="blogs"
            searchPlaceholder="Search blogs..."
            rowKey="id"
            renderExpandedRow={renderExpandedRow}
          />
        </Card>
      )}
    </div>
  );
};

export default BlogPage;
