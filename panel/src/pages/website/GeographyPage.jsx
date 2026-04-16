import { Component, useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, Edit, Trash, Plus, LoaderCircle, RefreshCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const TAB_CONFIG = {
  states: {
    label: 'States',
    singular: 'State',
    endpoint: '/settings/states',
    searchPlaceholder: 'Search states...',
  },
  cities: {
    label: 'Cities',
    singular: 'City',
    endpoint: '/settings/cities',
    searchPlaceholder: 'Search cities...',
  },
  areas: {
    label: 'Areas',
    singular: 'Area',
    endpoint: '/settings/areas',
    searchPlaceholder: 'Search areas...',
  },
};

const createInitialForm = (tab) => {
  if (tab === 'states') {
    return { name: '' };
  }

  if (tab === 'cities') {
    return { state_id: '', name: '', code: '' };
  }

  return { state_id: '', city_id: '', name: '', pincode: '' };
};

class GeographyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected error while opening geography page.',
    };
  }

  componentDidCatch(error) {
    console.error('GeographyPage render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6 fade-in">
          <PageHeader
            title="Geography Setup"
            icon={MapIcon}
            subtitle="This page hit a render error. The message below will help us fix it quickly."
          />
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {this.state.errorMessage}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const GeographyPageContent = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('states');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(createInitialForm('states'));

  const loadGeography = useCallback(async () => {
    try {
      setIsLoading(true);

      const [statesResponse, citiesResponse, areasResponse] = await Promise.all([
        apiRequest('/settings/states'),
        apiRequest('/settings/cities'),
        apiRequest('/settings/areas'),
      ]);

      setStates(statesResponse.data || []);
      setCities(citiesResponse.data || []);
      setAreas(areasResponse.data || []);
    } catch (error) {
      addToast(error.message || 'Unable to load geography data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadGeography();
  }, [loadGeography]);

  useEffect(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(createInitialForm(activeTab));
  }, [activeTab]);

  const stateMap = useMemo(
    () => new Map(states.map((state) => [String(state.id), state])),
    [states]
  );

  const cityMap = useMemo(
    () => new Map(cities.map((city) => [String(city.id), city])),
    [cities]
  );

  const cityCountByState = useMemo(() => {
    const counts = {};
    cities.forEach((city) => {
      const key = String(city.state_id);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [cities]);

  const areaCountByCity = useMemo(() => {
    const counts = {};
    areas.forEach((area) => {
      const key = String(area.city_id);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [areas]);

  const areaCountByState = useMemo(() => {
    const counts = {};
    areas.forEach((area) => {
      const stateId = area.state_id ?? cityMap.get(String(area.city_id))?.state_id;
      if (!stateId) {
        return;
      }

      const key = String(stateId);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [areas, cityMap]);

  const totalCount = useMemo(() => {
    if (activeTab === 'states') {
      return states.length;
    }

    if (activeTab === 'cities') {
      return cities.length;
    }

    return areas.length;
  }, [activeTab, areas.length, cities.length, states.length]);

  const canCreate = useMemo(() => {
    if (activeTab === 'states') {
      return true;
    }

    if (activeTab === 'cities') {
      return states.length > 0;
    }

    return cities.length > 0;
  }, [activeTab, cities.length, states.length]);

  const filteredCities = useMemo(() => {
    if (activeTab !== 'areas') {
      return cities;
    }

    if (!form.state_id) {
      return cities;
    }

    return cities.filter((city) => String(city.state_id) === String(form.state_id));
  }, [activeTab, cities, form.state_id]);

  const tableRows = useMemo(() => {
    if (activeTab === 'states') {
      return states.map((state, index) => ({
        ...state,
        serial: index + 1,
        citiesCount: cityCountByState[String(state.id)] || 0,
        areasCount: areaCountByState[String(state.id)] || 0,
      }));
    }

    if (activeTab === 'cities') {
      return cities.map((city, index) => ({
        ...city,
        serial: index + 1,
        stateLabel: city.state_name || stateMap.get(String(city.state_id))?.name || '-',
        codeLabel: city.code || '-',
        areasCount: areaCountByCity[String(city.id)] || 0,
      }));
    }

    return areas.map((area, index) => {
      const city = cityMap.get(String(area.city_id));
      const state = city ? stateMap.get(String(city.state_id)) : null;

      return {
        ...area,
        serial: index + 1,
        cityLabel: area.city_name || city?.name || '-',
        stateLabel: area.state_name || state?.name || '-',
        pincodeLabel: area.pincode || '-',
      };
    });
  }, [
    activeTab,
    areaCountByCity,
    areaCountByState,
    areas,
    cities,
    cityCountByState,
    cityMap,
    stateMap,
    states,
  ]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(createInitialForm(activeTab));
  }, [activeTab]);

  const openCreateModal = useCallback(() => {
    if (!canCreate) {
      const message =
        activeTab === 'cities'
          ? 'Add at least one state before creating a city.'
          : 'Add at least one city before creating an area.';
      addToast(message, 'error');
      return;
    }

    setEditingItem(null);
    setForm(createInitialForm(activeTab));
    setIsModalOpen(true);
  }, [activeTab, addToast, canCreate]);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);

    if (activeTab === 'states') {
      setForm({ name: item.name || '' });
    } else if (activeTab === 'cities') {
      setForm({
        state_id: String(item.state_id || ''),
        name: item.name || '',
        code: item.code || '',
      });
    } else {
      const city = cityMap.get(String(item.city_id));
      setForm({
        state_id: String(item.state_id ?? city?.state_id ?? ''),
        city_id: String(item.city_id || ''),
        name: item.name || '',
        pincode: item.pincode || '',
      });
    }

    setIsModalOpen(true);
  }, [activeTab, cityMap]);

  const handleDelete = useCallback(async (item) => {
    const resource = TAB_CONFIG[activeTab].singular.toLowerCase();
    const confirmed = window.confirm(`Delete ${resource} "${item.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`${TAB_CONFIG[activeTab].endpoint}/${item.id}`, { method: 'DELETE' });
      addToast(`${TAB_CONFIG[activeTab].singular} deleted successfully.`);
      await loadGeography();
    } catch (error) {
      addToast(error.message || `Unable to delete ${resource}.`, 'error');
    }
  }, [activeTab, addToast, loadGeography]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (activeTab === 'areas' && name === 'state_id') {
        return { ...current, state_id: value, city_id: '' };
      }

      return { ...current, [name]: value };
    });
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      addToast(`${TAB_CONFIG[activeTab].singular} name is required.`, 'error');
      return;
    }

    if (activeTab === 'cities' && !form.state_id) {
      addToast('Select a state for this city.', 'error');
      return;
    }

    if (activeTab === 'areas') {
      if (!form.state_id) {
        addToast('Select a state for this area.', 'error');
        return;
      }

      if (!form.city_id) {
        addToast('Select a city for this area.', 'error');
        return;
      }
    }

    const payload =
      activeTab === 'states'
        ? { name: form.name.trim() }
        : activeTab === 'cities'
          ? { state_id: Number(form.state_id), name: form.name.trim(), code: form.code.trim() }
          : {
              city_id: Number(form.city_id),
              name: form.name.trim(),
              pincode: form.pincode.trim(),
            };

    const endpoint = editingItem
      ? `${TAB_CONFIG[activeTab].endpoint}/${editingItem.id}`
      : TAB_CONFIG[activeTab].endpoint;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      setIsSubmitting(true);
      await apiRequest(endpoint, { method, body: payload });
      addToast(
        `${TAB_CONFIG[activeTab].singular} ${editingItem ? 'updated' : 'created'} successfully.`
      );
      closeModal();
      await loadGeography();
    } catch (error) {
      addToast(error.message || 'Unable to save geography data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => {
    const actionColumn = {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="rounded bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            aria-label={`Edit ${row.name}`}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            aria-label={`Delete ${row.name}`}
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    };

    if (activeTab === 'states') {
      return [
        { key: 'serial', label: 'S.No' },
        {
          key: 'name',
          label: 'State Name',
          render: (value) => <span className="font-semibold text-slate-800 dark:text-white">{value}</span>,
        },
        { key: 'citiesCount', label: 'Cities' },
        { key: 'areasCount', label: 'Areas' },
        actionColumn,
      ];
    }

    if (activeTab === 'cities') {
      return [
        { key: 'serial', label: 'S.No' },
        {
          key: 'name',
          label: 'City Name',
          render: (value) => <span className="font-semibold text-slate-800 dark:text-white">{value}</span>,
        },
        { key: 'stateLabel', label: 'State' },
        {
          key: 'codeLabel',
          label: 'City Code',
          render: (value) => (
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {value}
            </span>
          ),
        },
        { key: 'areasCount', label: 'Areas' },
        actionColumn,
      ];
    }

    return [
      { key: 'serial', label: 'S.No' },
      {
        key: 'name',
        label: 'Area Name',
        render: (value) => <span className="font-semibold text-slate-800 dark:text-white">{value}</span>,
      },
      { key: 'cityLabel', label: 'City' },
      { key: 'stateLabel', label: 'State' },
      {
        key: 'pincodeLabel',
        label: 'Pincode',
        render: (value) => <span className="font-mono text-slate-600 dark:text-slate-300">{value}</span>,
      },
      actionColumn,
    ];
  }, [activeTab, handleDelete, handleEdit]);

  const renderModalFields = () => {
    if (activeTab === 'states') {
      return (
        <Input
          label="State Name"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Tamil Nadu"
        />
      );
    }

    if (activeTab === 'cities') {
      return (
        <div className="grid gap-4">
          <Select
            label="State"
            name="state_id"
            value={form.state_id}
            onChange={handleInputChange}
            options={[
              { label: 'Select state', value: '' },
              ...states.map((state) => ({ label: state.name, value: String(state.id) })),
            ]}
          />
          <Input
            label="City Name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="Sivakasi"
          />
          <Input
            label="City Code"
            name="code"
            value={form.code}
            onChange={handleInputChange}
            placeholder="SVK"
          />
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <Select
          label="State"
          name="state_id"
          value={form.state_id}
          onChange={handleInputChange}
          options={[
            { label: 'Select state', value: '' },
            ...states.map((state) => ({ label: state.name, value: String(state.id) })),
          ]}
        />
        <Select
          label="City"
          name="city_id"
          value={form.city_id}
          onChange={handleInputChange}
          options={[
            { label: 'Select city', value: '' },
            ...filteredCities.map((city) => ({ label: city.name, value: String(city.id) })),
          ]}
        />
        <Input
          label="Area Name"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Reserve Line"
        />
        <Input
          label="Pincode"
          name="pincode"
          value={form.pincode}
          onChange={handleInputChange}
          placeholder="626123"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Geography Setup"
        icon={MapIcon}
        subtitle="Manage service locations with linked state, city, and area master data."
        badge={`${totalCount} ${TAB_CONFIG[activeTab].label.toLowerCase()}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" icon={RefreshCcw} onClick={loadGeography} disabled={isLoading}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={openCreateModal} disabled={!canCreate}>
              Add {TAB_CONFIG[activeTab].singular}
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 pb-px dark:border-white/10">
        {Object.entries(TAB_CONFIG).map(([tabKey, tabValue]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tabKey
                ? 'border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            {tabValue.label}
          </button>
        ))}
      </div>

      {!canCreate && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {activeTab === 'cities'
            ? 'Create a state first, then you can add cities.'
            : 'Create a city first, then you can add areas.'}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading geography data...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableRows}
          searchPlaceholder={TAB_CONFIG[activeTab].searchPlaceholder}
          exportable={false}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`${editingItem ? 'Edit' : 'Add'} ${TAB_CONFIG[activeTab].singular}`}
      >
        <div className="space-y-5">
          {renderModalFields()}

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const GeographyPage = () => (
  <GeographyErrorBoundary>
    <GeographyPageContent />
  </GeographyErrorBoundary>
);

export default GeographyPage;
