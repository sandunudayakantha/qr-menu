import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import Modal from '../../components/Modal';
import { FormInput } from '../../components/FormFields';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  Bars3Icon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const MenuBuilderPage = () => {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Fetch Menu Details
  const { data: menu } = useQuery({
    queryKey: ['menuDetails', menuId],
    queryFn: async () => {
      const res = await api.get('/menus', { params: { branchId: activeBranch?._id } });
      return res.data?.find((m) => m._id === menuId);
    },
    enabled: !!activeBranch && !!menuId
  });

  // Fetch Menu Items
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuItems', menuId],
    queryFn: async () => {
      const res = await api.get('/menu-items', { params: { menuId } });
      return res.data;
    },
    enabled: !!menuId
  });

  // Fetch All Global Branch Products
  const { data: allProducts = [] } = useQuery({
    queryKey: ['ownerProducts', activeBranch?._id],
    queryFn: async () => {
      const res = await api.get('/products', { params: { branchId: activeBranch?._id } });
      return res.data;
    },
    enabled: !!activeBranch
  });

  // Filter out products already in this menu
  const availableProducts = allProducts.filter(
    (p) => !menuItems.some((item) => item.product?._id === p._id)
  );

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: (data) => api.post('/menu-items', data),
    onSuccess: () => {
      toast.success('Product added to menu!');
      queryClient.invalidateQueries(['menuItems', menuId]);
      setAddModalOpen(false);
      setSelectedProductId('');
      setCustomPrice('');
    },
    onError: (err) => toast.error(err.message || 'Failed to add product to menu.')
  });

  // Update Item Mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/menu-items/${id}`, data),
    onSuccess: () => {
      toast.success('Menu item updated!');
      queryClient.invalidateQueries(['menuItems', menuId]);
      setEditItem(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update item.')
  });

  // Reorder Mutation
  const reorderMutation = useMutation({
    mutationFn: (items) => api.put('/menu-items/reorder', { items }),
    onSuccess: () => {
      toast.success('Sort order updated!');
    }
  });

  // Remove Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: (id) => api.delete(`/menu-items/${id}`),
    onSuccess: () => {
      toast.success('Product removed from menu.');
      queryClient.invalidateQueries(['menuItems', menuId]);
    }
  });

  // Handle Drag End
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedPayload = items.map((item, idx) => ({
      id: item._id,
      sortOrder: idx + 1
    }));

    queryClient.setQueryData(['menuItems', menuId], items);
    reorderMutation.mutate(reorderedPayload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/menus')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Menu Builder: {menu?.name || 'Loading...'}
            </h2>
            <p className="text-sm text-slate-500">
              Drag and drop items to reorder, set custom menu prices, and toggle availability.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (availableProducts.length > 0) {
              setSelectedProductId(availableProducts[0]._id);
            }
            setAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product to Menu
        </button>
      </div>

      {/* Drag & Drop List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="menuItems">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Loading menu layout...</div>
              ) : menuItems.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
                  No products in this menu yet. Click "Add Product to Menu" above to begin.
                </div>
              ) : (
                menuItems.map((item, index) => (
                  <Draggable key={item._id} draggableId={item._id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border ${
                          snapshot.isDragging
                            ? 'border-emerald-500 shadow-2xl bg-emerald-50/20'
                            : 'border-slate-200 dark:border-slate-800 shadow-sm'
                        } flex items-center justify-between gap-4 transition`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Drag to reorder"
                          >
                            <Bars3Icon className="w-5 h-5" />
                          </div>

                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                              {item.product?.name?.charAt(0)}
                            </div>
                          )}

                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {item.product?.name}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span>Category: {item.product?.category?.name || 'General'}</span>
                              <span>•</span>
                              <span>Prep: {item.product?.prepTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Actions & Price */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                              Menu Price
                            </span>
                            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                              LKR {item.price.toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              updateItemMutation.mutate({
                                id: item._id,
                                data: { available: !item.available }
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              item.available
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {item.available ? <CheckIcon className="w-3.5 h-3.5" /> : <XMarkIcon className="w-3.5 h-3.5" />}
                            {item.available ? 'Available' : 'Hidden'}
                          </button>

                          <button
                            onClick={() => {
                              setEditItem(item);
                              setEditPrice(item.price);
                            }}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Edit Price"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${item.product?.name} from this menu?`)) {
                                removeItemMutation.mutate(item._id);
                              }
                            }}
                            className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remove from Menu"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Product Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Product to Menu">
        {availableProducts.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            All products in your branch catalog are already added to this menu!
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItemMutation.mutate({
                menuId,
                productId: selectedProductId,
                price: customPrice
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Product from Catalog
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              >
                {availableProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.category?.name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label="Menu Price (LKR)"
              type="number"
              step="0.01"
              placeholder="e.g. 1250.00"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={addItemMutation.isPending}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
            >
              Add Product to Menu
            </button>
          </form>
        )}
      </Modal>

      {/* Edit Price Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Update Price for ${editItem?.product?.name}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateItemMutation.mutate({
              id: editItem._id,
              data: { price: editPrice }
            });
          }}
          className="space-y-4"
        >
          <FormInput
            label="Override Price for This Menu (LKR)"
            type="number"
            step="0.01"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={updateItemMutation.isPending}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            Save Price Update
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MenuBuilderPage;
