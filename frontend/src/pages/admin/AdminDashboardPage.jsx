import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { CardSkeleton } from '../../components/Skeleton';
import {
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  ShoppingBagIcon,
  DocumentTextIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard-stats');
      return res.data;
    }
  });

  const cards = [
    { name: 'Total Restaurants', value: stats?.totalRestaurants, icon: BuildingStorefrontIcon, color: 'from-blue-500 to-indigo-600' },
    { name: 'Total Branches', value: stats?.totalBranches, icon: BuildingOffice2Icon, color: 'from-emerald-500 to-teal-600' },
    { name: 'Total Products', value: stats?.totalProducts, icon: ShoppingBagIcon, color: 'from-amber-500 to-orange-600' },
    { name: 'Total Menus', value: stats?.totalMenus, icon: DocumentTextIcon, color: 'from-purple-500 to-pink-600' },
    { name: 'Total QR Codes', value: stats?.totalQRCodes, icon: QrCodeIcon, color: 'from-cyan-500 to-blue-600' },
    { name: 'Active Accounts', value: stats?.activeRestaurants, icon: CheckCircleIcon, color: 'from-emerald-600 to-green-700' },
    { name: 'Suspended Accounts', value: stats?.suspendedRestaurants, icon: ExclamationCircleIcon, color: 'from-rose-500 to-red-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Super Admin Platform Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Global SaaS system metrics across all registered restaurant tenants
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {card.name}
                    </p>
                    <p className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
                      {card.value ?? 0}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
