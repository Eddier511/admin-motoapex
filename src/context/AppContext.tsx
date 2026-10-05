import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Page, Toast } from '../types';

interface AppContextType {
  currentPage: Page;
  navigate: (page: Page, params?: Record<string, string>) => void;
  pageParams: Record<string, string>;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useCallback((page: Page, params: Record<string, string> = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  }, []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed(c => !c), []);

  const login = useCallback((email: string, _password: string) => {
    if (email.includes('@')) {
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  }, []);

  return (
    <AppContext.Provider value={{
      currentPage, navigate, pageParams,
      toasts, addToast, removeToast,
      sidebarCollapsed, toggleSidebar,
      isAuthenticated, login, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
