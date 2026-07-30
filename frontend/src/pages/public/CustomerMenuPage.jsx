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
  BuildingStorefrontIcon,
  StarIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const CustomerMenuPage = () => {
  const { token } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [orderAdded, setOrderAdded] = useState(false);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] text-white p-6 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-widest text-orange-400 uppercase">Preparing Gourmet Menu...</p>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] text-white p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 text-rose-500 flex items-center justify-center border border-rose-800/40">
          <InformationCircleIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Menu Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {error?.response?.data?.message || 'The scanned QR code is invalid, inactive, or the menu is currently offline.'}
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

  const handleOpenProductDetail = (productWithPrice) => {
    setSelectedProduct(productWithPrice);
    setItemQuantity(1);
    setOrderAdded(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Dribbble-Style Brand Header */}
      <div className="relative border-b border-slate-900 overflow-hidden bg-gradient-to-b from-[#141418] to-[#0B0B0D]">
        {branch?.coverImage && (
          <div className="absolute inset-0 opacity-15">
            <img src={branch.coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-transparent" />
          </div>
        )}

        <div className="relative max-w-md mx-auto px-5 pt-8 pb-6 space-y-4">
          {/* Top Bar: Logo & Branch Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {restaurant?.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="w-16 h-16 rounded-full object-cover shadow-xl flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-2xl shadow-xl flex-shrink-0">
                  {restaurant?.name?.charAt(0) || 'R'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-black tracking-tight text-white">{restaurant?.name}</h1>
                <p className="text-xs font-bold text-orange-400 tracking-wider uppercase mt-0.5">{branch?.name || 'Gourmet Dining'}</p>
              </div>
            </div>

            {tableName && (
              <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                {tableName}
              </span>
            )}
          </div>



          {/* Instant Search Bar */}
          <div className="relative flex items-center">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sushi, rolls, beverages..."
              className="w-full pl-12 pr-11 py-3.5 rounded-full bg-transparent border border-slate-800/90 hover:border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 text-xs font-medium transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center absolute right-3.5 transition shadow-sm"
                title="Clear search"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-7">
        {/* Category Horizontal Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-white tracking-wide">Categories</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{categories.length + 1} Available</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none items-center">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap inline-flex items-center justify-center text-center ${
                selectedCategoryId === 'ALL'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-[#16161A] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              All Types
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategoryId(cat._id)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap inline-flex items-center justify-center text-center ${
                  selectedCategoryId === cat._id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-[#16161A] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dribbble Style Featured Recommendations Hero Platter Carousel */}
        {featuredSections.length > 0 && !searchQuery && (
          <div className="space-y-3">
            {featuredSections.map((sec) => (
              <div key={sec._id} className="space-y-3">
                <div className="flex items-center px-1">
                  <h3 className="font-black text-sm text-white tracking-wide">{sec.title}</h3>
                </div>

                {/* Carousel Horizontal Scroll Cards */}
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                  {sec.products?.map((prod) => {
                    // Match price from menuItems
                    const matchedMenuItem = menuItems.find((mi) => (mi.product?._id || mi.product) === prod._id);
                    const itemPrice = matchedMenuItem ? matchedMenuItem.price : 0;

                    return (
                      <div
                        key={prod._id}
                        onClick={() => handleOpenProductDetail({ ...prod, price: itemPrice })}
                        className="w-52 flex-shrink-0 bg-[#16161A] rounded-3xl p-4 border border-slate-800/80 hover:border-orange-500/50 transition-all group cursor-pointer shadow-xl relative overflow-hidden flex flex-col items-center text-center"
                      >
                        {/* Circular Food Platter Hero Thumbnail */}
                        <div className="relative w-32 h-32 mb-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-all duration-300 shadow-2xl"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                              <ShoppingBagIcon className="w-10 h-10" />
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-extrabold text-xs text-white group-hover:text-orange-400 transition line-clamp-1 w-full">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 px-1">
                          {prod.description || 'Gourmet handcrafted recipe.'}
                        </p>

                        {/* Price Tag */}
                        <div className="mt-3 w-full flex items-center justify-center pt-2 border-t border-slate-800">
                          <span className="font-black text-xs text-orange-400">
                            LKR {itemPrice > 0 ? itemPrice.toFixed(2) : '1,850.00'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Premium A la Carte Catalog List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-white tracking-wide">Premium A la carte</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {filteredMenuItems.length} Items
            </span>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="p-10 text-center bg-[#16161A] rounded-3xl border border-slate-800 text-slate-500 text-xs">
              No gourmet items match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMenuItems.map((item) => {
                const prod = item.product;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleOpenProductDetail({ ...prod, price: item.price })}
                    className="p-3.5 bg-[#16161A] rounded-3xl border border-slate-800/80 hover:border-orange-500/50 transition-all shadow-xl flex gap-3.5 items-center cursor-pointer group"
                  >
                    {/* Left Circular Thumbnail */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full rounded-full object-cover transition-all shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <ShoppingBagIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
                          ★ Premium
                        </span>
                        <h4 className="font-extrabold text-xs text-white truncate group-hover:text-orange-400 transition">
                          {prod.name}
                        </h4>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {prod.description || 'Gourmet kitchen preparation.'}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-slate-400">
                          <ClockIcon className="w-3 h-3 text-orange-500" />
                          {prod.prepTime || '15 mins'}
                        </span>
                      </div>
                    </div>

                    {/* Right Price & Arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-black text-xs text-orange-400">
                        LKR {item.price.toFixed(2)}
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-orange-500 text-slate-400 group-hover:text-white flex items-center justify-center transition shadow-md">
                        <ChevronRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dribbble Style Product Showcase Modal / Drawer */}
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name || 'Item Details'}>
        {selectedProduct && (
          <div className="space-y-6 pt-1 text-white">
            {/* Center Circular Food Platter Hero Display */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative w-44 h-44 my-2">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full rounded-full object-cover shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <ShoppingBagIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{selectedProduct.name}</h3>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#16161A] p-3.5 rounded-2xl border border-slate-800/80">
                {selectedProduct.description || 'Freshly prepared with authentic premium ingredients by our head chef.'}
              </p>
            </div>

            {/* 2 Specs Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#16161A] border border-slate-800 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500">Category</p>
                <p className="text-xs font-extrabold text-white truncate mt-1">
                  {selectedProduct.category?.name || 'Gourmet'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#16161A] border border-slate-800 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500">Prep Time</p>
                <p className="text-xs font-extrabold text-white truncate mt-1">
                  {selectedProduct.prepTime || '15 mins'}
                </p>
              </div>
            </div>

            {/* Bottom Price Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-col items-center justify-center text-center p-3.5 rounded-2xl bg-[#16161A] border border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Price</span>
              <span className="text-lg font-black text-orange-400 mt-0.5">
                LKR {selectedProduct.price ? selectedProduct.price.toFixed(2) : '1,850.00'}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerMenuPage;
