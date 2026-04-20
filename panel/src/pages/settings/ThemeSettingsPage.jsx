import { useEffect, useState } from 'react';
import { LoaderCircle, Palette, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { apiRequest } from '../../lib/api';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const themeFields = [
  {
    key: 'color_primary',
    label: 'Primary',
    description: 'Storefront background and large surface color.',
    defaultValue: '#f8fafc',
  },
  {
    key: 'color_secondary',
    label: 'Secondary',
    description: 'Cards, sections, and elevated surface color.',
    defaultValue: '#ffffff',
  },
  {
    key: 'color_tertiary',
    label: 'Tertiary',
    description: 'Highlights, accents, and supporting emphasis color.',
    defaultValue: '#f59e0b',
  },
  {
    key: 'color_quaternary',
    label: 'Quaternary',
    description: 'Primary CTA, headers, and strong brand color.',
    defaultValue: '#ec4899',
  },
];

const initialForm = themeFields.reduce((accumulator, field) => {
  accumulator[field.key] = field.defaultValue;
  return accumulator;
}, {});

const initialErrors = themeFields.reduce((accumulator, field) => {
  accumulator[field.key] = '';
  return accumulator;
}, {});

const isValidHexColor = (value = '') => HEX_COLOR_REGEX.test(value.trim());

const ThemeSettingsPage = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadThemeSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/settings/theme');
      setForm({
        ...initialForm,
        ...(response.data || {}),
      });
      setErrors(initialErrors);
    } catch (error) {
      addToast(error.message || 'Unable to load theme settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const updateFieldValue = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: value && !isValidHexColor(value) ? 'Use full hex color format like #a1b2c3.' : '',
    }));
  };

  const validateForm = () => {
    const nextErrors = themeFields.reduce((accumulator, field) => {
      const value = form[field.key] ?? '';
      accumulator[field.key] = isValidHexColor(value) ? '' : 'Use full hex color format like #a1b2c3.';
      return accumulator;
    }, {});

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('Please fix the invalid theme colors before saving.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = themeFields.reduce((accumulator, field) => {
        accumulator[field.key] = form[field.key].trim().toLowerCase();
        return accumulator;
      }, {});

      const response = await apiRequest('/settings/theme', {
        method: 'PUT',
        body: payload,
      });

      setForm({
        ...initialForm,
        ...(response.data || payload),
      });
      setErrors(initialErrors);
      addToast('Theme settings saved successfully.');
    } catch (error) {
      addToast(error.message || 'Unable to save theme settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field) => {
    const value = form[field.key] ?? field.defaultValue;
    const pickerValue = isValidHexColor(value) ? value : field.defaultValue;

    return (
      <div key={field.key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{field.label}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{field.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={pickerValue}
            onChange={(event) => updateFieldValue(field.key, event.target.value)}
            disabled={isLoading || isSaving}
            className="h-12 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0a0a0f]"
          />
          <Input
            value={value}
            onChange={(event) => updateFieldValue(field.key, event.target.value)}
            onBlur={(event) => updateFieldValue(field.key, event.target.value.trim())}
            placeholder={field.defaultValue}
            disabled={isLoading || isSaving}
            className="flex-1"
          />
        </div>

        {errors[field.key] ? (
          <p className="text-sm text-rose-500 dark:text-rose-400">{errors[field.key]}</p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Saved as storefront theme token `{field.key}`.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <PageHeader
        title="Theme Settings"
        icon={Palette}
        subtitle="Manage storefront brand colors without affecting the admin panel light/dark mode."
        action={
          <Button onClick={handleSave} icon={Save} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Theme'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading theme settings...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="h-fit">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Theme Tokens</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure the 4 storefront palette values exposed through the theme API.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {themeFields.map(renderField)}
              </div>
            </div>
          </Card>

          <Card className="h-fit">
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Live Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preview the storefront palette locally before saving.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {themeFields.map((field) => {
                  const swatchColor = isValidHexColor(form[field.key]) ? form[field.key] : field.defaultValue;

                  return (
                    <div key={field.key} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                      <div className="h-20" style={{ backgroundColor: swatchColor }} />
                      <div className="space-y-1 bg-white p-3 dark:bg-[#13131a]">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{field.label}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{swatchColor}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm dark:border-white/10"
                style={{ backgroundColor: isValidHexColor(form.color_primary) ? form.color_primary : initialForm.color_primary }}
              >
                <div className="space-y-4 p-5">
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: isValidHexColor(form.color_secondary) ? form.color_secondary : initialForm.color_secondary }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isValidHexColor(form.color_quaternary) ? form.color_quaternary : initialForm.color_quaternary }}
                    >
                      Festival Offer
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Storefront previews can consume these same tokens through the public theme API.
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-full px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: isValidHexColor(form.color_tertiary) ? form.color_tertiary : initialForm.color_tertiary }}
                    >
                      Primary Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ThemeSettingsPage;
