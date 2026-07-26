import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    if (user && user.role === 'RESTAURANT_OWNER') {
      setLoading(true);
      try {
        const res = await api.get('/branches');
        const branchList = res.data || [];
        setBranches(branchList);

        if (branchList.length > 0) {
          const savedBranchId = localStorage.getItem('activeBranchId');
          const matched = branchList.find(b => b._id === savedBranchId);
          const defaultBranch = matched || branchList.find(b => b.isMain) || branchList[0];
          setActiveBranch(defaultBranch);
          localStorage.setItem('activeBranchId', defaultBranch._id);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setBranches([]);
      setActiveBranch(null);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [user]);

  const switchBranch = (branch) => {
    setActiveBranch(branch);
    localStorage.setItem('activeBranchId', branch._id);
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, switchBranch, fetchBranches, loading }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
