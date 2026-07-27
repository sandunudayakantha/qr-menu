import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput, FormSelect, FormTextarea } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline';

const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted.');
      queryClient.invalidateQueries(['ownerProducts']);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete product.')
  });

  const handleOpen = (prod = null) => {
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

  const handleClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const columns = [
    {
      header: 'Product Name',
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
            <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
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
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpen(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete ${row.name}?`)) deleteMutation.mutate(row._id);
            }}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
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
            Products created here can be assigned across multiple menus with custom prices.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
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
