import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput, FormTextarea } from '../../components/FormFields';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  SparklesIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const FeaturedPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Search & Pagination inside Featured Products Manager Modal
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const modalPageSize = 5;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    products: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Fetch Branch Products for selection (fetch full branch catalog with limit=1000)
  const { data: rawProductsData = [] } = useQuery({
    queryKey: ['ownerProductsAll', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/products', { params: { branchId: activeBranch?._id, limit: 1000 } });
      return res;
    },
    enabled: !!activeBranch
  });

  // Safely resolve products array regardless of response wrapper
  const allProducts = Array.isArray(rawProductsData)
    ? rawProductsData
    : (rawProductsData?.data || []);

  // Fetch Featured Sections
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['featuredSections', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/featured', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingSection) {
        return api.put(`/featured/${editingSection._id}`, data);
      }
      return api.post('/featured', { ...data, branchId: activeBranch._id });
    },
    onSuccess: () => {
      toast.success(editingSection ? 'Featured banner updated!' : 'Featured banner created!');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save section.')
  });

  // Direct Active/Inactive status toggle mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/featured/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Featured banner activated!' : 'Featured banner deactivated.');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to update banner status.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/featured/${id}`),
    onSuccess: () => {
      toast.success('Featured banner deleted.');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete section.')
  });

  const handleOpenEdit = (sec = null) => {
    if (sec) {
      setEditingSection(sec);
      setFormData({
        title: sec.title,
        description: sec.description || '',
        products: sec.products?.map((p) => p._id || p) || [],
        startDate: sec.startDate ? new Date(sec.startDate).toISOString().slice(0, 10) : '',
        endDate: sec.endDate ? new Date(sec.endDate).toISOString().slice(0, 10) : '',
        isActive: sec.isActive
      });
    } else {
      setEditingSection(null);
      setFormData({
        title: "Chef's Recommendation",
        description: 'Special dishes recommended by our head chef.',
        products: [],
        startDate: '',
        endDate: '',
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleOpenProductsManager = (sec) => {
    setEditingSection(sec);
    setFormData({
      title: sec.title,
      description: sec.description || '',
      products: sec.products?.map((p) => p._id || p) || [],
      startDate: sec.startDate ? new Date(sec.startDate).toISOString().slice(0, 10) : '',
      endDate: sec.endDate ? new Date(sec.endDate).toISOString().slice(0, 10) : '',
      isActive: sec.isActive
    });
    setModalPage(1);
    setProductSearchTerm('');
    setProductsModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setProductsModalOpen(false);
    setEditingSection(null);
    setProductSearchTerm('');
    setModalPage(1);
  };

  const toggleProductSelection = (pId) => {
    setFormData((prev) => {
      const exists = prev.products.includes(pId);
      return {
        ...prev,
        products: exists ? prev.products.filter((id) => id !== pId) : [...prev.products, pId]
      };
    });
  };

  const handleSearchChange = (e) => {
    setProductSearchTerm(e.target.value);
    setModalPage(1);
  };

  // Filter & Paginate products inside modal
  const filteredCatalogProducts = allProducts.filter((p) =>
    !productSearchTerm || p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const totalModalPages = Math.ceil(filteredCatalogProducts.length / modalPageSize) || 1;
  const paginatedModalProducts = filteredCatalogProducts.slice(
    (modalPage - 1) * modalPageSize,
    modalPage * modalPageSize
  );

  const columns = [
    {
      header: 'Promo Banner Title',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{row.title}</div>
            <div className="text-xs text-slate-400">{row.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Included Products',
      accessor: 'products',
      render: (row) => (
        <button
          onClick={() => handleOpenProductsManager(row)}
          className="group px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition flex items-center gap-1.5"
          title="Click to view and edit included products"
        >
          <ShoppingBagIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span>{row.products?.length || 0} Products Included</span>
        </button>
      )
    },
    {
      header: 'Expiry Date Range',
      render: (row) => {
        if (!row.startDate && !row.endDate) return <span className="text-xs text-slate-400">Always Active</span>;
        return (
          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {row.startDate ? new Date(row.startDate).toLocaleDateString() : 'Now'} -{' '}
            {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Indefinite'}
          </div>
        );
      }
    },
    {
      header: 'Status (Click to Toggle)',
      accessor: 'isActive',
      render: (row) => (
        <button
          onClick={() => toggleActiveStatusMutation.mutate({ id: row._id, isActive: !row.isActive })}
          disabled={toggleActiveStatusMutation.isPending}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            row.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
          }`}
          title="Click to toggle Active / Inactive status on QR menu"
        >
          <span className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {row.isActive ? 'Active' : 'Inactive'}
        </button>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenProductsManager(row)}
            className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
            title="Manage Featured Products"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Manage Items
          </button>

          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Edit Banner Details"
          >
            <PencilIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Delete banner ${row.title}?`)) deleteMutation.mutate(row._id);
            }}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Banner"
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
            Featured Banners & Recommendations ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            Create promotional banners (Popular, Chef Recommendation, Today's Special) and add products to them.
          </p>
        </div>
        <button
          onClick={() => handleOpenEdit()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Create Promo Section
        </button>
      </div>

      <DataTable columns={columns} data={sections} loading={isLoading} searchPlaceholder="Search promo banners..." />

      {/* Main Banner Edit / Create Modal */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingSection ? 'Edit Featured Banner Settings' : 'Create Featured Banner'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Section Title"
            placeholder="e.g. Today's Special, Popular Choices"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <FormTextarea
            label="Subhead Description"
            placeholder="e.g. Handcrafted gourmet recipes made fresh daily"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Start Date (Optional)"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <FormInput
              label="End Date / Expiry (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Banner is Active on Customer QR Menu
            </label>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingSection ? 'Update Banner Settings' : 'Create Featured Banner'}
          </button>
        </form>
      </Modal>

      {/* Dedicated Products Manager Modal with Always-Visible Pagination Bar */}
      <Modal
        isOpen={productsModalOpen}
        onClose={handleClose}
        title={`Manage Products in Banner: "${editingSection?.title}"`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Header Banner info */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                {editingSection?.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {editingSection?.description || 'Select which catalog items appear under this banner'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-extrabold text-xs">
              {formData.products.length} Selected
            </span>
          </div>

          {/* Search catalog products */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={productSearchTerm}
              onChange={handleSearchChange}
              placeholder="Search product catalog to include..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Products List Grid (Paginated 5 per page) */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {paginatedModalProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No catalog products found matching your search.
              </div>
            ) : (
              paginatedModalProducts.map((prod) => {
                const isSelected = formData.products.includes(prod._id);
                return (
                  <div
                    key={prod._id}
                    onClick={() => toggleProductSelection(prod._id)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <PhotoIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{prod.name}</h5>
                        <p className="text-[10px] text-slate-400">
                          {prod.category?.name || 'General'} • Prep: {prod.prepTime || '15 mins'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckIcon className="w-4 h-4" /> Included
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" /> Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Always-Visible Pagination Control Bar */}
          <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredCatalogProducts.length > 0 ? (modalPage - 1) * modalPageSize + 1 : 0} to{' '}
              {Math.min(modalPage * modalPageSize, filteredCatalogProducts.length)} of {filteredCatalogProducts.length} items
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalPage((p) => Math.max(p - 1, 1))}
                disabled={modalPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeftIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300 px-1">
                Page {modalPage} of {totalModalPages}
              </span>
              <button
                type="button"
                onClick={() => setModalPage((p) => Math.min(p + 1, totalModalPages))}
                disabled={modalPage >= totalModalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronRightIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm"
            >
              {saveMutation.isPending ? 'Saving Changes...' : 'Save Included Products'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeaturedPage;
