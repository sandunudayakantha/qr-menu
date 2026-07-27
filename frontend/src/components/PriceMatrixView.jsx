import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from './Modal';
import { FormInput } from './FormFields';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  PlusIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const PriceMatrixView = ({ branchId }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [editingCell, setEditingCell] = useState(null); // { productId, productName, menuId, menuName, menuItemId, currentPrice }
  const [editPriceInput, setEditPriceInput] = useState('');

  // Fetch Paginated Price Matrix Data from Server
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['priceMatrix', branchId, currentPage, selectedCategory, searchTerm],
    queryFn: async () => {
      const res = await api.get('/menus/price-matrix', {
        params: {
          branchId,
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          categoryId: selectedCategory
        }
      });
      return res;
    },
    enabled: !!branchId
  });

  const matrixPayload = responseData?.data || responseData || {};
  const meta = responseData?.meta || { total: 0, page: 1, limit: pageSize, totalPages: 1 };

  const { menus = [], products = [], categories = [], matrix = {} } = matrixPayload;

  // Add/Update Menu Item Price Mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ menuItemId, menuId, productId, price }) => {
      if (menuItemId) {
        return api.put(`/menu-items/${menuItemId}`, { price });
      } else {
        return api.post('/menu-items', { menuId, productId, price });
      }
    },
    onSuccess: () => {
      toast.success('Price updated in matrix!');
      queryClient.invalidateQueries(['priceMatrix']);
      queryClient.invalidateQueries(['ownerMenus']);
      setEditingCell(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update price.')
  });

  // Remove Product from Menu Mutation
  const removeProductMutation = useMutation({
    mutationFn: (menuItemId) => api.delete(`/menu-items/${menuItemId}`),
    onSuccess: () => {
      toast.success('Removed product from menu!');
      queryClient.invalidateQueries(['priceMatrix']);
      queryClient.invalidateQueries(['ownerMenus']);
      setEditingCell(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to remove item.')
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  // CSV Export Report Generator
  const downloadCSVReport = () => {
    if (products.length === 0 || menus.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    const headerRow = ['Product Name', 'Category', 'Prep Time', ...menus.map((m) => `"${m.name}"`)].join(',');
    csvContent += headerRow + '\r\n';

    products.forEach((p) => {
      const row = [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category?.name || 'General'}"`,
        `"${p.prepTime || '15 mins'}"`,
        ...menus.map((m) => {
          const item = matrix[p._id]?.[m._id];
          return item ? item.price : 'N/A';
        })
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Price_Matrix_Report_Page${currentPage}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Price Matrix report downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-lg">
            {meta.total ?? products.length}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Server Paginated Items</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-lg">
            {menus.length}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Digital Menus</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Compared Across Columns</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-lg">
            {pageSize}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Items Per Page</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">High Scale Performance</p>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search catalog products..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => handleCategoryChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryChange(cat._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                selectedCategory === cat._id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Export Button */}
        <button
          onClick={downloadCSVReport}
          className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export CSV Page Report
        </button>
      </div>

      {/* Main Price Matrix Table Container with Sticky Freeze-Panes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Fetching Paginated Price Matrix...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No menus created yet for this branch. Please create a menu first!
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No catalog products matched your query.
          </div>
        ) : (
          <>
            {/* Scroll Container with Fixed Max Height for Stable Sticky Header */}
            <div className="overflow-auto max-h-[580px] relative scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {/* Double Sticky Corner Header */}
                    <th className="px-6 py-4 sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 min-w-[260px] shadow-sm">
                      Product Details
                    </th>
                    {/* Sticky Table Header Columns */}
                    {menus.map((m) => (
                      <th
                        key={m._id}
                        className="px-6 py-3.5 text-center min-w-[170px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                          {m.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {products.map((prod) => {
                    const prices = menus.map((m) => matrix[prod._id]?.[m._id]?.price).filter((p) => p !== undefined);
                    const hasVariance = new Set(prices).size > 1;

                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        {/* Sticky Left Product Column */}
                        <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center gap-3">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                <PhotoIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <span>{prod.name}</span>
                                {hasVariance && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                    Price Variant
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{prod.category?.name || 'General'}</span>
                                <span>•</span>
                                <span>{prod.prepTime || '15 mins'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Menu Price Cells */}
                        {menus.map((menu) => {
                          const cellData = matrix[prod._id]?.[menu._id];
                          const price = cellData?.price;
                          const isIncluded = price !== undefined;

                          return (
                            <td key={menu._id} className="px-6 py-4 text-center">
                              {isIncluded ? (
                                <button
                                  onClick={() =>
                                    setEditingCell({
                                      productId: prod._id,
                                      productName: prod.name,
                                      menuId: menu._id,
                                      menuName: menu.name,
                                      menuItemId: cellData.menuItemId,
                                      currentPrice: price
                                    })
                                  }
                                  className="group inline-flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition w-full"
                                >
                                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                                    LKR {price.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold group-hover:underline flex items-center gap-1 mt-0.5">
                                    <PencilSquareIcon className="w-3 h-3" /> Edit Price
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCell({
                                      productId: prod._id,
                                      productName: prod.name,
                                      menuId: menu._id,
                                      menuName: menu.name,
                                      menuItemId: null,
                                      currentPrice: ''
                                    });
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-xs font-semibold transition w-full"
                                >
                                  <PlusIcon className="w-3.5 h-3.5" />
                                  Add to Menu
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Server Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, meta.total || products.length)} of {meta.total || products.length} products
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {meta.totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.totalPages || 1))}
                  disabled={currentPage >= (meta.totalPages || 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Price Modal */}
      <Modal
        isOpen={!!editingCell}
        onClose={() => setEditingCell(null)}
        title={`Set Price for ${editingCell?.productName} in "${editingCell?.menuName}"`}
      >
        {editingCell && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePriceMutation.mutate({
                menuItemId: editingCell.menuItemId,
                menuId: editingCell.menuId,
                productId: editingCell.productId,
                price: Number(editPriceInput)
              });
            }}
            className="space-y-4"
          >
            <FormInput
              label="Price for This Specific Menu (LKR)"
              type="number"
              step="0.01"
              placeholder="e.g. 750.00"
              defaultValue={editingCell.currentPrice}
              onChange={(e) => setEditPriceInput(e.target.value)}
              required
            />

            <div className="flex gap-3 pt-2">
              {editingCell.menuItemId && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove ${editingCell.productName} from ${editingCell.menuName}?`)) {
                      removeProductMutation.mutate(editingCell.menuItemId);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition"
                >
                  Remove From Menu
                </button>
              )}

              <button
                type="submit"
                disabled={updatePriceMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
              >
                {updatePriceMutation.isPending ? 'Updating...' : 'Save Matrix Price'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PriceMatrixView;
