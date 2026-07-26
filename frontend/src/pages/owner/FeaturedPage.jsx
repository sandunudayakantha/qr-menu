import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput, FormTextarea } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';

const FeaturedPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    products: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Fetch Products for selection
  const { data: allProducts = [] } = useQuery({
    queryKey: ['ownerProducts', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/products', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

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
      toast.success(editingSection ? 'Featured section updated!' : 'Featured section created!');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save section.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/featured/${id}`),
    onSuccess: () => {
      toast.success('Featured section deleted.');
      queryClient.invalidateQueries(['featuredSections', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete section.')
  });

  const handleOpen = (sec = null) => {
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

  const handleClose = () => {
    setModalOpen(false);
    setEditingSection(null);
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

  const columns = [
    {
      header: 'Promo Title',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
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
      header: 'Included Items',
      accessor: 'products',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
          {row.products?.length || 0} Products
        </span>
      )
    },
    {
      header: 'Expiry Range',
      render: (row) => {
        if (!row.startDate && !row.endDate) return <span className="text-xs text-slate-400">Always Active</span>;
        return (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {row.startDate ? new Date(row.startDate).toLocaleDateString() : 'Now'} -{' '}
            {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Indefinite'}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => <Badge variant={row.isActive ? 'active' : 'inactive'}>{row.isActive ? 'Active' : 'Disabled'}</Badge>
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
              if (window.confirm(`Delete ${row.title}?`)) deleteMutation.mutate(row._id);
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
            Featured Banners & Recommendations ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            Create promotional banners (Popular, Chef Recommendation, Today's Special) with auto-expiry.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Create Promo Section
        </button>
      </div>

      <DataTable columns={columns} data={sections} loading={isLoading} searchPlaceholder="Search promo sections..." />

      <Modal isOpen={modalOpen} onClose={handleClose} title={editingSection ? 'Edit Featured Section' : 'Create Featured Section'}>
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

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Select Featured Products
            </label>
            <div className="max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              {allProducts.map((prod) => (
                <label key={prod._id} className="flex items-center gap-3 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.products.includes(prod._id)}
                    onChange={() => toggleProductSelection(prod._id)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>{prod.name} ({prod.category?.name || 'General'})</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingSection ? 'Update Section' : 'Create Featured Section'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FeaturedPage;
