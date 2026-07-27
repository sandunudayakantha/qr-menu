import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import PriceMatrixView from '../../components/PriceMatrixView';
import { FormInput, FormTextarea } from '../../components/FormFields';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  WrenchIcon,
  TableCellsIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';

const MenusPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [activeTab, setActiveTab] = useState('LIST'); // 'LIST' | 'MATRIX'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['ownerMenus', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/menus', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingMenu) {
        return api.put(`/menus/${editingMenu._id}`, data);
      }
      return api.post('/menus', { ...data, branchId: activeBranch._id });
    },
    onSuccess: () => {
      toast.success(editingMenu ? 'Menu updated!' : 'Menu created!');
      queryClient.invalidateQueries(['ownerMenus', activeBranch?._id]);
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save menu.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/menus/${id}`),
    onSuccess: () => {
      toast.success('Menu deleted.');
      queryClient.invalidateQueries(['ownerMenus', activeBranch?._id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete menu.')
  });

  const handleOpen = (m = null) => {
    if (m) {
      setEditingMenu(m);
      setFormData({ name: m.name, description: m.description || '', status: m.status });
    } else {
      setEditingMenu(null);
      setFormData({ name: '', description: '', status: 'ACTIVE' });
    }
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingMenu(null);
  };

  const columns = [
    {
      header: 'Menu Title',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
          <div className="text-xs text-slate-400">{row.description || 'No description'}</div>
        </div>
      )
    },
    {
      header: 'Items Count',
      accessor: 'itemCount',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.itemCount || 0} Products
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/menus/${row._id}/builder`}
            className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
          >
            <WrenchIcon className="w-4 h-4" />
            Menu Builder
          </Link>

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
      {/* Header & Segmented Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Digital Menus & Price Matrix ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            Manage menus or compare product prices across all menus in a single matrix report view.
          </p>
        </div>

        {/* View Segmented Toggle */}
        <div className="p-1 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center gap-1 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'LIST'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <QueueListIcon className="w-4 h-4" />
            Menus List
          </button>
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'MATRIX'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableCellsIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Price Matrix Report
          </button>
        </div>
      </div>

      {/* Tab Body */}
      {activeTab === 'LIST' ? (
        <DataTable
          columns={columns}
          data={menus}
          loading={isLoading}
          searchPlaceholder="Search menus..."
          actionButton={
            <button
              onClick={() => handleOpen()}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
            >
              <PlusIcon className="w-4 h-4" />
              Create Menu
            </button>
          }
        />
      ) : (
        <PriceMatrixView branchId={activeBranch?._id} />
      )}

      {/* Create / Edit Menu Modal */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingMenu ? 'Edit Menu' : 'Create New Menu'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Menu Title"
            placeholder="e.g. VIP Lounge Menu, Weekend Breakfast"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FormTextarea
            label="Description"
            placeholder="Brief overview of this menu..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingMenu ? 'Update Menu' : 'Create Menu'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MenusPage;
