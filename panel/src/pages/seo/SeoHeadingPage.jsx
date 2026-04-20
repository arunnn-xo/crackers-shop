import { useCallback, useEffect, useMemo, useState } from 'react';
import { Type, Edit, LoaderCircle, Plus, RefreshCcw, Trash } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const SeoHeadingPage = () => {
  const { addToast } = useToast();
  const [seoHeadings, setSeoHeadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHeading, setEditingHeading] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formValues, setFormValues] = useState({
    page_name: '',
    heading: '',
  });

  const loadSeoHeadings = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        setErrorMessage('');
        if (showLoader) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const response = await apiRequest('/settings/seo-headings');
        setSeoHeadings(response.data || []);
      } catch (error) {
        const nextMessage = error.message || 'Unable to load SEO headings.';
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
    loadSeoHeadings({ showLoader: true });
  }, [loadSeoHeadings]);

  const resetForm = useCallback(() => {
    setFormValues({
      page_name: '',
      heading: '',
    });
    setEditingHeading(null);
  }, []);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (heading) => {
    setEditingHeading(heading);
    setFormValues({
      page_name: heading.page_name || '',
      heading: heading.heading || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = ({ force = false } = {}) => {
    if (isSaving && !force) {
      return;
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      page_name: formValues.page_name.trim(),
      heading: formValues.heading.trim(),
    };

    if (!payload.page_name) {
      addToast('Page name is required.', 'error');
      return;
    }

    if (!payload.heading) {
      addToast('Heading is required.', 'error');
      return;
    }

    try {
      setIsSaving(true);

      if (editingHeading) {
        await apiRequest(`/settings/seo-headings/${editingHeading.id}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('SEO heading updated successfully.');
      } else {
        await apiRequest('/settings/seo-headings', {
          method: 'POST',
          body: payload,
        });
        addToast('SEO heading created successfully.');
      }

      closeModal({ force: true });
      await loadSeoHeadings();
    } catch (error) {
      addToast(error.message || 'Unable to save SEO heading.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (heading) => {
    const confirmed = window.confirm(`Delete SEO heading for "${heading.page_name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest(`/settings/seo-headings/${heading.id}`, {
        method: 'DELETE',
      });
      addToast('SEO heading deleted successfully.');
      await loadSeoHeadings();
    } catch (error) {
      addToast(error.message || 'Unable to delete SEO heading.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tableRows = useMemo(
    () =>
      seoHeadings.map((heading, index) => ({
        ...heading,
        serial: index + 1,
      })),
    [seoHeadings]
  );

  const cols = useMemo(
    () => [
      { key: 'serial', label: 'S.No' },
      {
        key: 'page_name',
        label: 'Page Name',
        render: (value) => <span className="font-medium text-slate-800 dark:text-white">{value}</span>,
      },
      {
        key: 'heading',
        label: 'Heading',
        render: (value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              title={`Edit ${row.page_name}`}
              disabled={isSaving}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              title={`Delete ${row.page_name}`}
              disabled={isSaving}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [isSaving]
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="SEO Heading"
        icon={Type}
        subtitle="Manage page-specific SEO headings shown on the customer-facing website."
        badge={`${seoHeadings.length} headings`}
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={RefreshCcw}
              onClick={() => loadSeoHeadings()}
              disabled={isRefreshing || isSaving}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={openCreateModal} disabled={isSaving}>
              Add SEO Heading
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading SEO headings...</span>
          </div>
        </div>
      ) : errorMessage && tableRows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load SEO headings</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <Button onClick={() => loadSeoHeadings({ showLoader: true })}>Retry</Button>
          </div>
        </Card>
      ) : tableRows.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No SEO headings added yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create the first SEO heading to manage page-level messaging here.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable columns={cols} data={tableRows} exportFileName="seo-headings" />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingHeading ? 'Edit SEO Heading' : 'Add SEO Heading'}
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <Input
            label="Page Name"
            name="page_name"
            value={formValues.page_name}
            onChange={handleInputChange}
            placeholder="Enter page name"
            disabled={isSaving}
          />
          <Input
            label="Heading"
            name="heading"
            value={formValues.heading}
            onChange={handleInputChange}
            placeholder="Enter heading"
            disabled={isSaving}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingHeading ? 'Save Changes' : 'Create Heading'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SeoHeadingPage;
