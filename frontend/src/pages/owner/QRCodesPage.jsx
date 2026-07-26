import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import QRModal from '../../components/QRModal';
import Badge from '../../components/Badge';
import { FormInput, FormSelect } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, QrCodeIcon, ArrowTopRightOnSquareIcon, NoSymbolIcon, CheckIcon } from '@heroicons/react/24/outline';

const QRCodesPage = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewQR, setViewQR] = useState(null);

  const [formData, setFormData] = useState({
    menuId: '',
    tableName: ''
  });

  // Fetch Menus for dropdown
  const { data: menus = [] } = useQuery({
    queryKey: ['ownerMenus', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/menus', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  // Fetch QR Codes
  const { data: qrCodes = [], isLoading } = useQuery({
    queryKey: ['ownerQRCodes', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/qr', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/qr', { ...data, branchId: activeBranch._id }),
    onSuccess: () => {
      toast.success('Permanent QR Code generated!');
      queryClient.invalidateQueries(['ownerQRCodes', activeBranch?._id]);
      setCreateModalOpen(false);
      setFormData({ menuId: '', tableName: '' });
    },
    onError: (err) => toast.error(err.message || 'Failed to generate QR code.')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/qr/${id}/status`, { isActive }),
    onSuccess: () => {
      toast.success('QR Code status updated!');
      queryClient.invalidateQueries(['ownerQRCodes', activeBranch?._id]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/qr/${id}`),
    onSuccess: () => {
      toast.success('QR Code deleted.');
      queryClient.invalidateQueries(['ownerQRCodes', activeBranch?._id]);
    }
  });

  const columns = [
    {
      header: 'QR Token & Table',
      accessor: 'token',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs border border-indigo-200 dark:border-indigo-800">
            QR
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Token: {row.token}</span>
              {row.tableName && <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-normal text-slate-600">{row.tableName}</span>}
            </div>
            <div className="text-xs text-slate-400">Assigned Menu: {row.menu?.name || 'Standard Menu'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Target Link',
      render: (row) => (
        <a
          href={`/q/${row.token}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
        >
          <span>/q/{row.token}</span>
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </a>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => <Badge variant={row.isActive ? 'active' : 'inactive'}>{row.isActive ? 'Active' : 'Deactivated'}</Badge>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewQR(row)}
            className="py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition"
          >
            <QrCodeIcon className="w-4 h-4" />
            View & Export
          </button>

          <button
            onClick={() => toggleStatusMutation.mutate({ id: row._id, isActive: !row.isActive })}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              row.isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <NoSymbolIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Delete QR code token ${row.token}?`)) deleteMutation.mutate(row._id);
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
            QR Codes Studio ({activeBranch?.name})
          </h2>
          <p className="text-sm text-slate-500">
            Generate permanent QR codes for tables or dining sections. QR codes store permanent unique tokens.
          </p>
        </div>
        <button
          onClick={() => {
            if (menus.length > 0) setFormData({ menuId: menus[0]._id, tableName: '' });
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Generate Permanent QR
        </button>
      </div>

      <DataTable columns={columns} data={qrCodes} loading={isLoading} searchPlaceholder="Search QR tokens or table names..." />

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Generate New QR Code Token">
        {menus.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            Please create at least one digital menu before generating QR codes!
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <FormSelect
              label="Select Target Menu"
              value={formData.menuId}
              onChange={(e) => setFormData({ ...formData, menuId: e.target.value })}
              options={menus.map((m) => ({ value: m._id, label: m.name }))}
              required
            />

            <FormInput
              label="Table / Location Name (Optional)"
              placeholder="e.g. Table #04, Outdoor Terrace, Bar Section"
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
            />

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
            >
              {createMutation.isPending ? 'Generating...' : 'Generate Permanent QR Token'}
            </button>
          </form>
        )}
      </Modal>

      {/* View & Export Modal */}
      <QRModal isOpen={!!viewQR} onClose={() => setViewQR(null)} qrCode={viewQR} />
    </div>
  );
};

export default QRCodesPage;
