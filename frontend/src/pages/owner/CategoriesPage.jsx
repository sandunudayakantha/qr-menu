import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['ownerCategories', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/categories', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, data);
      }
      return api.post('/categories', { ...data, branchId: activeBranch._id });
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      queryClient.invalidateQueries(['ownerCategories', activeBranch?._id]);
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save category.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted.');
      queryClient.invalidateQueries(['ownerCategories', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete category.')
  });

  const handleOpen = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, sortOrder: cat.sortOrder });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', sortOrder: 0 });
    }
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (row) => <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
    },
    { header: 'Display Priority Order', accessor: 'sortOrder' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
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
            Menu Categories ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            Organize products into groups for customer navigation.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <DataTable columns={columns} data={categories} loading={isLoading} searchPlaceholder="Search categories..." />

      <Modal isOpen={modalOpen} onClose={handleClose} title={editingCategory ? 'Edit Category' : 'Create Category'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Category Name"
            placeholder="e.g. Italian Pizzas, Gourmet Burgers"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Sort Priority Order"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
