import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import TickerBanner from '@/components/layout/TickerBanner';
import SyncUser from '@/components/SyncUser';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <SyncUser />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />
        <TickerBanner />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
