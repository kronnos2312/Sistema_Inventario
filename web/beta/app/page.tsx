'use client';

import { useEffect, useState } from 'react';
import ProductsPage from './components/product/ProductsPage';
import InventoryPage from './components/inventory/InventoryPage';
import SalesPage from './components/sales/SalesPage';
import Layout from './components/base/Layout';
import Wellcome from './components/base/Wellcome';

type Tab = 'bienvenida' | 'productos' | 'inventarios' | 'ventas';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('bienvenida');

  useEffect(() => {
    document.title = getTitle(activeTab);
  }, [activeTab]);

  const getTitle = (tab: Tab) => {
    const app = process.env.NEXT_PUBLIC_SITE_TITLE || 'Sistema';
    const labels: Record<Tab, string> = {
      bienvenida: 'Bienvenido',
      productos: 'Productos',
      inventarios: 'Inventario',
      ventas: 'Ventas',
    };
    return `${labels[tab]} | ${app}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'bienvenida':
        return <Wellcome onNavigate={setActiveTab} />;
      case 'productos':
        return <ProductsPage />;
      case 'inventarios':
        return <InventoryPage />;
      case 'ventas':
        return <SalesPage />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
