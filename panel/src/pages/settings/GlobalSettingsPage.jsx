import { useEffect, useState } from 'react';
import {
  AtSign,
  BadgeCheck,
  Globe,
  LoaderCircle,
  Link2,
  Megaphone,
  MessageCircle,
  Phone,
  PlayCircle,
  Save,
  Share2,
  Store,
  UploadCloud,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { apiRequest, getAssetUrl } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const tabs = [
  { id: 'Brand & Logos', label: 'Brand & Logos', icon: Store },
  { id: 'Contact & Social', label: 'Contact & Social', icon: Share2 },
  { id: 'Advanced & SEO', label: 'Advanced & SEO', icon: Globe },
];

const socialFields = [
  { key: 'facebook_url', label: 'Facebook Link', icon: Link2, placeholder: 'https://facebook.com/your-page' },
  { key: 'instagram_url', label: 'Instagram Link', icon: AtSign, placeholder: 'https://instagram.com/your-page' },
  { key: 'twitter_url', label: 'Twitter/X Link', icon: MessageCircle, placeholder: 'https://x.com/your-page' },
  { key: 'linkedin_url', label: 'LinkedIn Link', icon: BadgeCheck, placeholder: 'https://linkedin.com/company/your-page' },
  { key: 'youtube_url', label: 'YouTube Link', icon: PlayCircle, placeholder: 'https://youtube.com/@your-channel' },
];

const initialForm = {
  company_name: '',
  seo_title: '',
  main_logo: '',
  favicon: '',
  primary_phone: '',
  email: '',
  address: '',
  whatsapp_number: '',
  footer_content: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  linkedin_url: '',
  youtube_url: '',
  offer_text_html: '',
  google_analytics_id: '',
};

const UploadTile = ({ label, note, previewUrl, emptyLabel, onChange, disabled = false, previewClassName = '' }) => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} <span className="text-amber-600/80 dark:text-amber-300/80">{note}</span>
    </p>
    <label className="block">
      <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={disabled} />
      <div className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-amber-300 hover:bg-amber-50/40 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-amber-500/20 dark:hover:bg-white/[0.04]">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0f0f15]">
        {previewUrl ? (
            <div className={`mx-auto flex items-center justify-center overflow-hidden rounded-lg bg-white p-4 dark:bg-[#0b0b11] ${previewClassName}`}>
            <img src={previewUrl} alt={label} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
            <div className={`mx-auto flex items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-400 dark:border-white/10 dark:bg-[#0b0b11] dark:text-slate-500 ${previewClassName}`}>
            {emptyLabel}
          </div>
        )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <UploadCloud className="h-4 w-4" />
          <span>{previewUrl ? `Change ${label}` : `Upload ${label}`}</span>
        </div>
      </div>
    </label>
  </div>
);

const SocialInput = ({ label, icon: Icon, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
    <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/10 dark:bg-[#0a0a0f]">
      <div className="flex w-12 items-center justify-center border-r border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-600"
      />
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="space-y-1 border-b border-slate-100 pb-5 dark:border-white/10">
    <div className="flex items-center gap-2 text-slate-800 dark:text-white">
      <Icon className="h-5 w-5 text-amber-500" />
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
  </div>
);

const GlobalSettingsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [form, setForm] = useState(initialForm);
  const [selectedFiles, setSelectedFiles] = useState({
    main_logo: null,
    favicon: null,
  });
  const [previews, setPreviews] = useState({
    main_logo: '',
    favicon: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/settings/global');
      const data = response.data || {};

      setForm({
        ...initialForm,
        ...data,
      });
      setSelectedFiles({
        main_logo: null,
        favicon: null,
      });
      setPreviews((current) => {
        Object.values(current).forEach((url) => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });

        return {
          main_logo: data.main_logo ? getAssetUrl(data.main_logo) : '',
          favicon: data.favicon ? getAssetUrl(data.favicon) : '',
        };
      });
    } catch (error) {
      addToast(error.message || 'Unable to load global settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (fieldName) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFiles((current) => ({
      ...current,
      [fieldName]: file,
    }));

    setPreviews((current) => {
      if (current[fieldName]?.startsWith('blob:')) {
        URL.revokeObjectURL(current[fieldName]);
      }

      return {
        ...current,
        [fieldName]: URL.createObjectURL(file),
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, value ?? '');
      });

      if (selectedFiles.main_logo) {
        payload.append('main_logo', selectedFiles.main_logo);
      }

      if (selectedFiles.favicon) {
        payload.append('favicon', selectedFiles.favicon);
      }

      await apiRequest('/settings/global', {
        method: 'PUT',
        body: payload,
      });

      addToast('Global settings saved successfully.');
      await loadSettings();
    } catch (error) {
      addToast(error.message || 'Unable to save global settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBrandTab = () => (
    <Card className="space-y-8">
      <SectionHeader
        icon={Store}
        title="Brand Identity"
        description="Manage your company name, SEO title and logo assets."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Company Name"
          name="company_name"
          value={form.company_name}
          onChange={handleInputChange}
          placeholder="BluVel Crackers"
        />
        <Input
          label="SEO Meta Title"
          name="seo_title"
          value={form.seo_title}
          onChange={handleInputChange}
          placeholder="BluVel Crackers"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadTile
          label="Main Logo"
          note="(140 x 69 px)"
          previewUrl={previews.main_logo}
          emptyLabel="Logo Preview"
          onChange={handleFileChange('main_logo')}
          disabled={isSaving}
          previewClassName="h-32 w-full"
        />
        <UploadTile
          label="Favicon"
          note="(40 x 40 px)"
          previewUrl={previews.favicon}
          emptyLabel="ICO"
          onChange={handleFileChange('favicon')}
          disabled={isSaving}
          previewClassName="h-28 w-full"
        />
      </div>
    </Card>
  );

  const renderContactTab = () => (
    <Card className="space-y-8">
      <SectionHeader
        icon={Phone}
        title="Contact Info"
        description="Update business contact details shown across the storefront."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Phone Number"
          name="primary_phone"
          value={form.primary_phone}
          onChange={handleInputChange}
          placeholder="8838254339"
        />
        <Input
          label="WhatsApp Number"
          name="whatsapp_number"
          value={form.whatsapp_number}
          onChange={handleInputChange}
          placeholder="8838254339"
        />
        <Input
          label="Email Address"
          name="email"
          value={form.email}
          onChange={handleInputChange}
          placeholder="contact@example.com"
        />
        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleInputChange}
          placeholder="123 Street Name, City, State"
        />
      </div>

      <RichTextEditor
        label="Footer Content"
        name="footer_content"
        value={form.footer_content}
        onChange={handleInputChange}
        placeholder="Enter footer content..."
      />

      <div className="space-y-5">
        <SectionHeader
          icon={Share2}
          title="Social Presence"
          description="Add your public social links for footer and contact sections."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {socialFields.map((field) => (
            <SocialInput
              key={field.key}
              label={field.label}
              icon={field.icon}
              value={form[field.key]}
              onChange={(event) =>
                handleInputChange({
                  target: {
                    name: field.key,
                    value: event.target.value,
                  },
                })
              }
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>
    </Card>
  );

  const renderAdvancedTab = () => (
    <Card className="space-y-8">
      <SectionHeader
        icon={Megaphone}
        title="Advanced & SEO"
        description="Configure analytics tracking and top offer bar content."
      />

      <div className="grid gap-6 md:grid-cols-1">
        <Input
          label="Google Analytics ID"
          name="google_analytics_id"
          value={form.google_analytics_id}
          onChange={handleInputChange}
          placeholder="G-XXXXXXX"
        />
      </div>

      <RichTextEditor
        label="Offer Text (Supports HTML)"
        name="offer_text_html"
        value={form.offer_text_html}
        onChange={handleInputChange}
        placeholder="Enter top offer bar text..."
        minHeightClass="min-h-[220px]"
      />
    </Card>
  );

  const renderActiveTab = () => {
    if (activeTab === 'Brand & Logos') {
      return renderBrandTab();
    }

    if (activeTab === 'Contact & Social') {
      return renderContactTab();
    }

    return renderAdvancedTab();
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader
        title="Global Configuration"
        icon={Globe}
        action={
          <Button onClick={handleSave} icon={Save} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading global settings...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px dark:border-white/10 custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderActiveTab()}
        </div>
      )}
    </div>
  );
};

export default GlobalSettingsPage;
