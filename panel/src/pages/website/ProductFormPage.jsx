import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, PackagePlus, Save, LoaderCircle, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/FormFields';
import { apiRequest, getAssetUrl } from '../../lib/api';

const initialForm = {
  category_id: '',
  name: '',
  sale_price: '',
  discount_percentage: '',
  price: '',
  content_unit: '',
  stock_status: 'In Stock',
  sort_order: '0',
  is_active: '1',
  description: '',
  image: '',
};

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(productId);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [categoriesResponse, productResponse] = await Promise.all([
          apiRequest('/categories'),
          isEditMode ? apiRequest(`/products/${productId}`) : Promise.resolve({ data: null }),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResponse.data || []);

        if (productResponse.data) {
          const product = productResponse.data;
          const price = Number(product.price || 0);
          const salePrice = Number(product.sale_price || 0);
          const discountPercentage = price > 0 ? (((price - salePrice) / price) * 100).toFixed(2) : '';

          setForm({
            category_id: String(product.category_id || ''),
            name: product.name || '',
            sale_price: String(product.sale_price ?? ''),
            discount_percentage: discountPercentage,
            price: String(product.price ?? ''),
            content_unit: product.content_unit || '',
            stock_status: product.stock_status || 'In Stock',
            sort_order: String(product.sort_order ?? 0),
            is_active: String(Number(product.is_active ?? 1)),
            description: product.description || '',
            image: product.image || '',
          });
          setPreviewUrl(getAssetUrl(product.image));
        }
      } catch (error) {
        addToast(error.message || 'Unable to load product form.', 'error');
        navigate('/website/products');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [addToast, isEditMode, navigate, productId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === 'sale_price' || name === 'discount_percentage') {
        const salePrice = Number(name === 'sale_price' ? value : next.sale_price || 0);
        const discount = Number(name === 'discount_percentage' ? value : next.discount_percentage || 0);
        next.price = discount >= 100 ? '' : salePrice > 0 ? (salePrice / (1 - discount / 100)).toFixed(2) : '';
      }

      return next;
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const categoryOptions = useMemo(
    () => [
      { label: 'Select Category', value: '' },
      ...(categories || []).map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    ],
    [categories]
  );

  const handleSubmit = async () => {
    if (!form.category_id) {
      addToast('Category is required.', 'error');
      return;
    }

    if (!form.name.trim()) {
      addToast('Product name is required.', 'error');
      return;
    }

    if (!isEditMode && !selectedFile) {
      addToast('Product image is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('category_id', form.category_id);
      payload.append('name', form.name.trim());
      payload.append('sale_price', String(Number(form.sale_price || 0)));
      payload.append('price', String(Number(form.price || 0)));
      payload.append('content_unit', form.content_unit.trim() || '1 Box');
      payload.append('stock_status', form.stock_status);
      payload.append('sort_order', String(Number(form.sort_order || 0)));
      payload.append('is_active', form.is_active);
      payload.append('description', form.description.trim());

      if (!selectedFile && form.image) {
        payload.append('image', form.image);
      }

      if (selectedFile) {
        payload.append('image', selectedFile);
      }

      if (isEditMode) {
        await apiRequest(`/products/${productId}`, {
          method: 'PUT',
          body: payload,
        });
        addToast('Product updated successfully.');
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: payload,
        });
        addToast('Product created successfully.');
      }

      navigate('/website/products');
    } catch (error) {
      addToast(error.message || 'Unable to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto">
      <PageHeader
        title={isEditMode ? 'Edit Product' : 'Add Product'}
        icon={PackagePlus}
        subtitle="Create and maintain catalog products with pricing and image upload."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/website/products')} icon={ArrowLeft}>
              Back
            </Button>
            <Button icon={Save} onClick={handleSubmit} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Add product'}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0f]">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading product...</span>
          </div>
        </div>
      ) : (
        <Card className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Choose Category*"
              name="category_id"
              value={form.category_id}
              onChange={handleInputChange}
              options={categoryOptions}
            />
            <Input
              label="Product Name*"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Product name"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
             {/* Left Column */}
            <div className="flex flex-col gap-6">
               <Input
                 label="Product alt Title*"
                 name="description"
                 value={form.description}
                 onChange={handleInputChange}
                 placeholder="Product Alt Title"
               />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  <Input
                    label="Sale Price*"
                    name="sale_price"
                    value={form.sale_price}
                    onChange={handleInputChange}
                    placeholder="Enter Sale Price"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <Input
                    label="Discount Percentage (%)*"
                    name="discount_percentage"
                    value={form.discount_percentage}
                    onChange={handleInputChange}
                    placeholder="Enter Percentage (e.g., 90)"
                    type="number"
                    min="0"
                    max="99.99"
                    step="0.01"
                  />
                  <Input
                    label="MRP Price (Auto-calculated)*"
                    name="price"
                    value={form.price}
                    disabled
                    placeholder="MRP Price"
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <Select
                    label="Stock"
                    name="stock_status"
                    value={form.stock_status}
                    onChange={handleInputChange}
                    options={[
                      { label: 'In Stock', value: 'In Stock' },
                      { label: 'Out of Stock', value: 'Out of Stock' },
                    ]}
                  />
                  <Input
                    label="Sort Order"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleInputChange}
                    type="number"
                    min="0"
                    placeholder="0"
                  />
               </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
               <label className="block h-[155px] cursor-pointer mt-0.5">
                  <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                    Product Image* <span className="text-rose-400 ml-1 font-normal">(670 x 800 px)</span>
                  </span>
                  <span className="sr-only">Upload Image</span>
                  <div className="flex h-[155px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center transition-colors hover:bg-slate-100/80 dark:border-white/20 dark:bg-[#0a0a0f]/50 dark:hover:bg-white/[0.04]">
                     <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                     {previewUrl ? (
                        <img src={previewUrl} alt="Product preview" className="h-full max-h-[120px] w-full rounded-md object-contain" />
                     ) : (
                        <>
                           <UploadCloud className="mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
                           <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drag & Drop or Click to Upload</p>
                           <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                             {selectedFile?.name || (form.image ? 'Existing image selected' : 'No file chosen')}
                           </p>
                        </>
                     )}
                  </div>
               </label>
               
               <div className="pt-1">
                  <Input
                    label="Content*"
                    name="content_unit"
                    value={form.content_unit}
                    onChange={handleInputChange}
                    placeholder="Product Type"
                  />
               </div>
               
               <div className="pt-1">
                  <Select
                    label="Status"
                    name="is_active"
                    value={form.is_active}
                    onChange={handleInputChange}
                    options={[
                      { label: 'Active', value: '1' },
                      { label: 'Inactive', value: '0' },
                    ]}
                  />
               </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button className="px-8 py-2.5 text-[15px]" icon={Save} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update product' : 'Add product'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductFormPage;
