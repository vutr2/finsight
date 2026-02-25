import WatchlistTable from '@/components/dashboard/WatchlistTable';
import TopMovers from '@/components/dashboard/TopMovers';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '4px' }}>
          Tổng quan thị trường
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Dữ liệu HOSE & HNX — cập nhật mỗi 30 giây
        </p>
      </div>

      <TopMovers />
      <WatchlistTable />
    </div>
  );
}
