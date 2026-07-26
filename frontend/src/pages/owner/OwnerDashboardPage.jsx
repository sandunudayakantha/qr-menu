import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import { CardSkeleton } from '../../components/Skeleton';
import { Link } from 'react-router-dom';
import {
  ShoppingBagIcon,
  DocumentTextIcon,
  QrCodeIcon,
  TagIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const OwnerDashboardPage = () => {
  const { activeBranch } = useBranch();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ownerDashboardStats', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/owner/dashboard-stats', {
        params: { branchId: activeBranch?._id }
      });
      return res.data;
    },
    enabled: !!activeBranch
  });

  const cards = [
    { name: 'Products Catalog', value: stats?.totalProducts, icon: ShoppingBagIcon, link: '/products', color: 'from-emerald-500 to-teal-600' },
    { name: 'Active Menus', value: stats?.totalMenus, icon: DocumentTextIcon, link: '/menus', color: 'from-indigo-500 to-purple-600' },
    { name: 'QR Codes Studio', value: stats?.totalQRCodes, icon: QrCodeIcon, link: '/qr-codes', color: 'from-cyan-500 to-blue-600' },
    { name: 'Categories', value: stats?.totalCategories, icon: TagIcon, link: '/categories', color: 'from-amber-500 to-orange-600' },
    { name: 'Branches Count', value: `${stats?.totalBranches ?? 0} / ${stats?.maxBranches ?? 3}`, icon: BuildingOffice2Icon, link: '/branches', color: 'from-purple-500 to-pink-600' },
    { name: 'Featured Promo Sections', value: stats?.totalFeatured, icon: SparklesIcon, link: '/featured', color: 'from-rose-500 to-red-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
            Active Branch: {activeBranch?.name || 'Main Branch'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome to Restaurant Portal
          </h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Manage your menus, product prices, featured recommendations, and export permanent QR codes for customer scanning.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/qr-codes"
            className="py-2.5 px-4 rounded-xl bg-white text-emerald-700 font-bold text-xs shadow-md hover:bg-emerald-50 transition flex items-center gap-1.5"
          >
            <QrCodeIcon className="w-4 h-4" />
            Generate QR
          </Link>
          <Link
            to="/menus"
            className="py-2.5 px-4 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-bold text-xs backdrop-blur-sm transition flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Create Menu
          </Link>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="group relative overflow-hidden p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500"
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

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Manage {card.name}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
