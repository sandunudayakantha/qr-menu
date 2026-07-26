import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { FormInput } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { PlusIcon, KeyIcon, NoSymbolIcon, CheckIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const AdminRestaurantsPage = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    maxBranches: 3
  });

  const [newPassword, setNewPassword] = useState('');
  const [newMaxBranches, setNewMaxBranches] = useState(3);

  // Fetch Restaurants
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['adminRestaurants'],
    queryFn: async () => {
      const res = await api.get('/admin/restaurants');
      return res.data;
    }
  });

  // Create Restaurant Mutation
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/restaurants', data),
    onSuccess: () => {
      toast.success('Restaurant and Owner account created successfully!');
      queryClient.invalidateQueries(['adminRestaurants']);
      setCreateModalOpen(false);
      setFormData({ name: '', ownerName: '', ownerEmail: '', ownerPassword: '', maxBranches: 3 });
    },
    onError: (err) => toast.error(err.message || 'Failed to create restaurant.')
  });

  // Toggle Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/restaurants/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries(['adminRestaurants']);
    },
    onError: (err) => toast.error(err.message || 'Failed to update status.')
  });

  // Branch Limit Mutation
  const limitMutation = useMutation({
    mutationFn: ({ id, maxBranches }) => api.patch(`/admin/restaurants/${id}/branch-limit`, { maxBranches }),
    onSuccess: () => {
      toast.success('Branch limit updated!');
      queryClient.invalidateQueries(['adminRestaurants']);
      setLimitModalOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to update branch limit.')
  });

  // Reset Password Mutation
  const resetPassMutation = useMutation({
    mutationFn: ({ id, newPassword }) => api.post(`/admin/restaurants/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully!');
      setResetModalOpen(false);
      setNewPassword('');
    },
    onError: (err) => toast.error(err.message || 'Failed to reset password.')
  });

  // Delete Restaurant Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/restaurants/${id}`),
    onSuccess: () => {
      toast.success('Restaurant deleted successfully.');
      queryClient.invalidateQueries(['adminRestaurants']);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete restaurant.')
  });

  const columns = [
    {
      header: 'Restaurant',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-emerald-600">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
            <div className="text-xs text-slate-400">Owner: {row.owner?.name || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Owner Email',
      accessor: 'owner.email',
      render: (row) => <span className="text-sm font-medium">{row.owner?.email}</span>
    },
    {
      header: 'Branches Limit',
      accessor: 'maxBranches',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {row.branchCount || 0} / {row.maxBranches}
          </span>
          <button
            onClick={() => { setSelectedRest(row); setNewMaxBranches(row.maxBranches); setLimitModalOpen(true); }}
            className="p-1 text-slate-400 hover:text-emerald-600"
            title="Edit Branch Limit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
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
          <button
            onClick={() => statusMutation.mutate({ id: row._id, status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              row.status === 'ACTIVE'
                ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.status === 'ACTIVE' ? 'Suspend Restaurant' : 'Activate Restaurant'}
          >
            {row.status === 'ACTIVE' ? <NoSymbolIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { setSelectedRest(row); setResetModalOpen(true); }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Reset Owner Password"
          >
            <KeyIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Delete ${row.name}? All branch and menu data will be removed!`)) {
                deleteMutation.mutate(row._id);
              }
            }}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Restaurant"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Manage SaaS Restaurants
          </h2>
          <p className="text-sm text-slate-500">
            Create restaurant tenants, set branch limits, and reset owner access.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Create Restaurant
        </button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={restaurants} loading={isLoading} searchPlaceholder="Search restaurants or owners..." />

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Restaurant Tenant">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <FormInput
            label="Restaurant Name"
            placeholder="e.g. Grand Spice Palace"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Owner Name"
            placeholder="e.g. Sarah Connor"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            required
          />
          <FormInput
            label="Owner Email (Login Username)"
            type="email"
            placeholder="owner@grandspice.com"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            required
          />
          <FormInput
            label="Initial Owner Password"
            type="password"
            placeholder="••••••••"
            value={formData.ownerPassword}
            onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
            required
          />
          <FormInput
            label="Max Allowed Branches"
            type="number"
            min="1"
            value={formData.maxBranches}
            onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            {createMutation.isPending ? 'Creating Tenant...' : 'Create Tenant & Owner Account'}
          </button>
        </form>
      </Modal>

      {/* Branch Limit Modal */}
      <Modal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} title={`Update Branch Limit for ${selectedRest?.name}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            limitMutation.mutate({ id: selectedRest._id, maxBranches: newMaxBranches });
          }}
          className="space-y-4"
        >
          <FormInput
            label="Maximum Allowed Branches"
            type="number"
            min="1"
            value={newMaxBranches}
            onChange={(e) => setNewMaxBranches(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={limitMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            Save Branch Limit
          </button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title={`Reset Owner Password - ${selectedRest?.owner?.email}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPassMutation.mutate({ id: selectedRest._id, newPassword });
          }}
          className="space-y-4"
        >
          <FormInput
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={resetPassMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            Reset Password
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRestaurantsPage;
