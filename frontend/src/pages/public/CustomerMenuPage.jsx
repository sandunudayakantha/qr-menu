import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Modal from '../../components/Modal';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const CustomerMenuPage = () => {
  const { token } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: menuData, isLoading, error } = useQuery({
    queryKey: ['publicMenu', token],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/public/menu/${token}`);
      return res.data.data;
    },
    enabled: !!token,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Loading digital menu...</p>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-900/40 text-rose-500 flex items-center justify-center">
          <InformationCircleIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Menu Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          {error?.response?.data?.message || 'The scanned QR code is invalid, inactive, or the menu is currently unavailable.'}
        </p>
      </div>
    );
  }

  const { restaurant, branch, menu, tableName, categories = [], menuItems = [], featuredSections = [] } = menuData;

  // Filter Items by Category & Search query
  const filteredMenuItems = menuItems.filter((item) => {
    const prod = item.product;
    if (!prod) return false;

    const matchesCategory =
      selectedCategoryId === 'ALL' ||
      prod.category?._id === selectedCategoryId ||
      prod.category === selectedCategoryId;

    const matchesSearch =
      !searchQuery ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* Hero Header Section */}
      <div className="relative bg-slate-900 border-b border-slate-800 overflow-hidden">
        {/* Cover Image Background */}
        {branch?.coverImage && (
          <div className="absolute inset-0 opacity-25">
            <img src={branch.coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        )}

        <div className="relative max-w-md mx-auto px-5 pt-8 pb-6 text-center space-y-4">
          {/* Restaurant Logo */}
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-xl">
            {restaurant?.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-2xl">
                {restaurant?.name?.charAt(0) || 'R'}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{restaurant?.name}</h1>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
              <BuildingStorefrontIcon className="w-3.5 h-3.5" />
              {branch?.name}
            </p>
            {tableName && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-extrabold border border-emerald-800">
                {tableName}
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Active Menu</span>
            <span className="text-sm font-extrabold text-white">{menu?.name}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Instant Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or ingredients..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-inner"
          />
        </div>

        {/* Featured Banner Section */}
        {featuredSections.length > 0 && !searchQuery && (
          <div className="space-y-3">
            {featuredSections.map((sec) => (
              <div key={sec._id} className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-800/50 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <SparklesIcon className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-white">{sec.title}</h3>
                </div>
                {sec.description && <p className="text-xs text-slate-300">{sec.description}</p>}

                {/* Horizontal Scrolling Featured Products */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {sec.products?.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => setSelectedProduct(prod)}
                      className="w-36 flex-shrink-0 bg-slate-950/90 rounded-2xl p-2.5 border border-slate-800 hover:border-emerald-500 transition cursor-pointer"
                    >
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-24 rounded-xl object-cover" />
                      ) : (
                        <div className="w-full h-24 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                          <ShoppingBagIcon className="w-6 h-6" />
                        </div>
                      )}
                      <p className="font-bold text-xs text-white truncate mt-2">{prod.name}</p>
                      <span className="text-[11px] font-extrabold text-emerald-400">Featured</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Horizontal Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
              selectedCategoryId === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                selectedCategoryId === cat._id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid / Cards */}
        <div className="space-y-4">
          {filteredMenuItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-sm">
              No menu products found.
            </div>
          ) : (
            filteredMenuItems.map((item) => {
              const prod = item.product;
              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedProduct({ ...prod, price: item.price })}
                  className="p-3.5 bg-slate-900 rounded-3xl border border-slate-800 hover:border-emerald-500/60 transition shadow-md flex gap-3.5 items-center cursor-pointer"
                >
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} className="w-24 h-24 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <ShoppingBagIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-white truncate">{prod.name}</h4>
                      <span className="font-black text-sm text-emerald-400 whitespace-nowrap">
                        LKR {item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {prod.description || 'Fresh gourmet preparation.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-400">
                        <ClockIcon className="w-3.5 h-3.5 text-emerald-500" />
                        {prod.prepTime || '15 mins'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">Available</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name || 'Product Details'}>
        {selectedProduct && (
          <div className="space-y-4">
            {selectedProduct.image && (
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-56 rounded-2xl object-cover" />
            )}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{selectedProduct.name}</h3>
                {selectedProduct.price !== undefined && (
                  <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                    LKR {selectedProduct.price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Category: {selectedProduct.category?.name || 'General'}</p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedProduct.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ClockIcon className="w-4 h-4 text-emerald-600" />
              <span>Estimated Preparation Time: {selectedProduct.prepTime || '15-20 mins'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerMenuPage;
