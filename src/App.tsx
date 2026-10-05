import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MotorcyclesList } from './pages/motorcycles/MotorcyclesList';
import { MotorcycleForm } from './pages/motorcycles/MotorcycleForm';
import { Brands } from './pages/Brands';
import { Leads } from './pages/Leads';
import { Categories, Promotions, Inventory, WebContent, Users, Settings } from './pages/OtherPages';

function AppShell() {
  const { isAuthenticated, currentPage } = useApp();

  if (!isAuthenticated) return <Login />;

  const pageMap: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    motorcycles: <MotorcyclesList />,
    'motorcycle-form': <MotorcycleForm />,
    brands: <Brands />,
    categories: <Categories />,
    promotions: <Promotions />,
    inventory: <Inventory />,
    content: <WebContent />,
    leads: <Leads />,
    users: <Users />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: 'var(--background)' }}>
        <TopBar />
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--background)' }}>
          {pageMap[currentPage] ?? <Dashboard />}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
