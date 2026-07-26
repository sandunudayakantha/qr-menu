import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FormInput } from '../../components/FormFields';
import toast from 'react-hot-toast';
import { QrCodeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <QrCodeIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            SaaS QR Menu Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your account credentials to access your portal
          </p>
        </div>

        {/* Demo Credentials Alert */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-300">Demo Accounts Available:</p>
          <div className="flex justify-between">
            <span>Super Admin:</span>
            <button
              onClick={() => { setEmail('admin@qrmenu.com'); setPassword('Admin@123456'); }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              admin@qrmenu.com
            </button>
          </div>
          <div className="flex justify-between">
            <span>Restaurant Owner:</span>
            <button
              onClick={() => { setEmail('owner@bistro.com'); setPassword('Owner@123456'); }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              owner@bistro.com
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LockClosedIcon className="w-4 h-4" />
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
