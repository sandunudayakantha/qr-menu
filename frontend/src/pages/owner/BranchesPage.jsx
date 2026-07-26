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

const BranchesPage = () => {
  const queryClient = useQueryClient();
  const { fetchBranches } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    isMain: false
  });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['ownerBranches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingBranch) {
        return api.put(`/branches/${editingBranch._id}`, data);
      }
      return api.post('/branches', data);
    },
    onSuccess: () => {
      toast.success(editingBranch ? 'Branch updated successfully!' : 'Branch created successfully!');
      queryClient.invalidateQueries(['ownerBranches']);
      fetchBranches();
      handleClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to save branch.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      toast.success('Branch deleted successfully.');
      queryClient.invalidateQueries(['ownerBranches']);
      fetchBranches();
    },
    onError: (err) => toast.error(err.message || 'Failed to delete branch.')
  });

  const handleOpen = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        isMain: branch.isMain
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', isMain: false });
    }
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingBranch(null);
  };

  const columns = [
    {
      header: 'Branch Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {row.name}
              {row.isMain && <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-600 text-white font-bold">Main</span>}
            </div>
            <div className="text-xs text-slate-400">{row.phone}</div>
          </div>
        </div>
      )
    },
    { header: 'Address', accessor: 'address' },
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
            title="Edit Branch"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          {!row.isMain && (
            <button
              onClick={() => {
                if (window.confirm(`Delete ${row.name}?`)) deleteMutation.mutate(row._id);
              }}
              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete Branch"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Restaurant Branches
          </h2>
          <p className="text-sm text-slate-500">
            Manage your restaurant locations. Each branch operates independent menus.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Branch
        </button>
      </div>

      <DataTable columns={columns} data={branches} loading={isLoading} searchPlaceholder="Search branches..." />

      <Modal isOpen={modalOpen} onClose={handleClose} title={editingBranch ? 'Edit Branch' : 'Add New Branch'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Branch Name"
            placeholder="e.g. Colombo Branch"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Address"
            placeholder="e.g. 77 Galle Road, Colombo 03"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <FormInput
            label="Phone Number"
            placeholder="e.g. +94 11 234 5678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {saveMutation.isPending ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BranchesPage;
