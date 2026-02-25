'use client';

import { useNews } from '@/hooks/useNews';
import NewsCard from '@/components/news/NewsCard';

export default function NewsPage() {
  const { articles, loading, error } = useNews();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>

      {/* Header */}
      <div>
        <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '4px' }}>
          Tin tức thị trường
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {loading ? 'Đang tải...' : `${articles.length} bài · cập nhật mỗi 5 phút`}
        </p>
      </div>

      {/* News list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '11px', width: '120px', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
              <div style={{ height: '14px', width: '90%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
              <div style={{ height: '14px', width: '70%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Không thể tải tin tức. Vui lòng thử lại sau.
        </div>
      ) : articles.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Không có tin tức
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
