import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import OwnerLayout from '../layouts/OwnerLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminRestaurantsPage from '../pages/admin/AdminRestaurantsPage';

import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import BranchesPage from '../pages/owner/BranchesPage';
import CategoriesPage from '../pages/owner/CategoriesPage';
import ProductsPage from '../pages/owner/ProductsPage';
import MenusPage from '../pages/owner/MenusPage';
import MenuBuilderPage from '../pages/owner/MenuBuilderPage';
import FeaturedPage from '../pages/owner/FeaturedPage';
import QRCodesPage from '../pages/owner/QRCodesPage';
import ProfilePage from '../pages/owner/ProfilePage';

import CustomerMenuPage from '../pages/public/CustomerMenuPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Customer QR Route - Instant Load Without Session Block */}
      <Route path="/q/:token" element={<CustomerMenuPage />} />

      {/* Auth Route */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Super Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="restaurants" element={<AdminRestaurantsPage />} />
      </Route>

      {/* Restaurant Owner Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="menus" element={<MenusPage />} />
        <Route path="menus/:menuId/builder" element={<MenuBuilderPage />} />
        <Route path="featured" element={<FeaturedPage />} />
        <Route path="qr-codes" element={<QRCodesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard') : '/login'} replace />} />
    </Routes>
  );
};

export default AppRoutes;
