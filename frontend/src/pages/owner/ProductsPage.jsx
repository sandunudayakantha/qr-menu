import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput, FormSelect, FormTextarea } from '../../components/FormFields';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PhotoIcon,
  EyeIcon,
  SparklesIcon,
  CheckIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [featuringProduct, setFeaturingProduct] = useState(null);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    prepTime: '15-20 mins',
    image: '',
    available: true
  });

  // Fetch Categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['ownerCategories', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/categories', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  // Fetch Paginated Products
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['ownerProducts', activeBranch?._id, currentPage, searchTerm],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          branchId: activeBranch?._id,
          page: currentPage,
          limit: pageSize,
          search: searchTerm
        }
      });
      return res;
    },
    enabled: !!activeBranch
  });

  const products = productsResponse?.data || [];
  const meta = productsResponse?.meta || { total: products.length, page: 1, limit: pageSize, totalPages: 1 };

  // Fetch Featured Banners for branch
  const { data: featuredSections = [] } = useQuery({
    queryKey: ['featuredSections', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/featured', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  // Mutation to save / update Product
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct._id}`, data);
      }
      return api.post('/products', { ...data, branchId: activeBranch._id });
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated!' : 'Product added to catalog!');
      queryClient.invalidateQueries(['ownerProducts']);
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save product.')
  });

  // Mutation to toggle product inside a featured banner
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ sectionId, productIds }) => {
      return api.put(`/featured/${sectionId}`, { products: productIds });
    },
    onSuccess: () => {
      toast.success('Featured status updated!');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to update featured banner.')
  });

  // Mutation to delete Product
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted.');
      queryClient.invalidateQueries(['ownerProducts']);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete product.')
  });

  const handleOpenEdit = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        name: prod.name,
        categoryId: prod.category?._id || '',
        description: prod.description || '',
        prepTime: prod.prepTime || '15-20 mins',
        image: prod.image || '',
        available: prod.available
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        categoryId: categories[0]?._id || '',
        description: '',
        prepTime: '15-20 mins',
        image: '',
        available: true
      });
    }
    setModalOpen(true);
  };

  const handleOpenView = (prod) => {
    setViewingProduct(prod);
    setViewModalOpen(true);
  };

  const handleOpenFeature = (prod) => {
    setFeaturingProduct(prod);
    setFeatureModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setFeatureModalOpen(false);
    setEditingProduct(null);
    setViewingProduct(null);
    setFeaturingProduct(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const columns = [
    {
      header: 'Product Details',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <PhotoIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{row.name}</span>
            </div>
            <div className="text-xs text-slate-400 line-clamp-1">{row.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category.name',
      render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-300">{row.category?.name || 'Unassigned'}</span>
    },
    { header: 'Prep Time', accessor: 'prepTime' },
    {
      header: 'Availability',
      accessor: 'available',
      render: (row) => <Badge variant={row.available ? 'active' : 'inactive'}>{row.available ? 'Available' : 'Sold Out'}</Badge>
    },
    {
      header: 'Actions',
      render: (row) => {
        // Check if product is featured in any banner
        const featuredInCount = featuredSections.filter((s) =>
          s.products?.some((p) => (p._id || p) === row._id)
        ).length;

        return (
          <div className="flex items-center gap-2">
            {/* View Product Details */}
            <button
              onClick={() => handleOpenView(row)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="View Product Details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>

            {/* Feature Product Action */}
            <button
              onClick={() => handleOpenFeature(row)}
              className={`py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                featuredInCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600'
              }`}
              title="Add or remove product from Featured Banners"
            >
              <SparklesIcon className="w-4 h-4 text-amber-500" />
              <span>{featuredInCount > 0 ? `Featured (${featuredInCount})` : 'Feature'}</span>
            </button>

            {/* Edit Product */}
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Edit Product"
            >
              <PencilIcon className="w-4 h-4" />
            </button>

            {/* Delete Product */}
            <button
              onClick={() => {
                if (window.confirm(`Delete ${row.name}?`)) deleteMutation.mutate(row._id);
              }}
              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete Product"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Global Product Catalog ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            View product specs or feature items on promo banners directly from this catalog.
          </p>
        </div>
        <button
          onClick={() => handleOpenEdit()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        searchPlaceholder="Search catalog..."
        onSearch={handleSearch}
        serverPagination={true}
        page={currentPage}
        pageSize={pageSize}
        totalPages={meta.totalPages}
        total={meta.total}
        onPageChange={setCurrentPage}
      />

      {/* 1. View Product Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={handleClose} title="Product Showcase & Specs">
        {viewingProduct && (
          <div className="space-y-5">
            {/* Image Preview Banner */}
            <div className="w-full h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700">
              {viewingProduct.image ? (
                <img src={viewingProduct.image} alt={viewingProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <PhotoIcon className="w-10 h-10" />
                  <span className="text-xs font-semibold">No Image Uploaded</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant={viewingProduct.available ? 'active' : 'inactive'}>
                  {viewingProduct.available ? 'Available' : 'Sold Out'}
                </Badge>
              </div>
            </div>

            {/* Product Meta Info */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{viewingProduct.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {viewingProduct.description || 'No detailed description added for this product.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Category</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {viewingProduct.category?.name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Prep Time</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {viewingProduct.prepTime || '15-20 mins'}
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Banners List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                Featured Banners Assignment
              </h4>
              <div className="flex flex-wrap gap-2">
                {featuredSections.filter((s) => s.products?.some((p) => (p._id || p) === viewingProduct._id)).length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Not currently featured on any promotional banners.</span>
                ) : (
                  featuredSections
                    .filter((s) => s.products?.some((p) => (p._id || p) === viewingProduct._id))
                    .map((sec) => (
                      <span key={sec._id} className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        ★ {sec.title}
                      </span>
                    ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenFeature(viewingProduct);
                }}
                className="py-2.5 px-4 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition flex items-center gap-1.5"
              >
                <SparklesIcon className="w-4 h-4" /> Feature This Product
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenEdit(viewingProduct);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition"
              >
                Edit Product
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Feature Product in Banners Modal */}
      <Modal isOpen={featureModalOpen} onClose={handleClose} title={`Feature "${featuringProduct?.name}" on Banners`}>
        {featuringProduct && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which promotional banners should feature <span className="font-bold text-slate-900 dark:text-white">{featuringProduct.name}</span> on the customer QR menu:
            </p>

            {featuredSections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                No featured banners created yet for this branch. Please create a banner first under the Featured Banners menu.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {featuredSections.map((section) => {
                  const isIncluded = section.products?.some((p) => (p._id || p) === featuringProduct._id);
                  return (
                    <div
                      key={section._id}
                      onClick={() => {
                        const currentProductIds = section.products?.map((p) => p._id || p) || [];
                        const updatedIds = isIncluded
                          ? currentProductIds.filter((id) => id !== featuringProduct._id)
                          : [...currentProductIds, featuringProduct._id];

                        toggleFeatureMutation.mutate({ sectionId: section._id, productIds: updatedIds });
                      }}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isIncluded
                          ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-400'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
                          <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{section.title}</h4>
                          <p className="text-[10px] text-slate-400">{section.description || 'Promotional section'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isIncluded
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isIncluded ? (
                          <>
                            <CheckIcon className="w-4 h-4" /> Featured
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4" /> Add to Banner
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Create / Edit Product Modal */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingProduct ? 'Edit Product' : 'Add Product to Catalog'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Product Name"
            placeholder="e.g. Truffle Wagyu Burger"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FormSelect
            label="Category"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            required
          />

          <FormTextarea
            label="Description"
            placeholder="Detailed description of ingredients and flavors..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <FormInput
            label="Image URL"
            placeholder="https://images.unsplash.com/..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          />

          <FormInput
            label="Preparation Time"
            placeholder="e.g. 15-20 mins"
            value={formData.prepTime}
            onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded"
            />
            <label htmlFor="available" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product is Available for Ordering
            </label>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Catalog'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
