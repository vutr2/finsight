'use client';

import { useState } from 'react';

// ─── Dữ liệu khóa học & video ─────────────────────────────────────────────
// Thay các link affiliate của bạn vào trường `affiliateUrl` nếu có
// YouTube links dùng embed ID để hiện preview thumbnail
const CATEGORIES = [
  {
    id: 'beginner',
    label: 'Cơ bản',
    icon: '📘',
  },
  {
    id: 'technical',
    label: 'Phân tích kỹ thuật',
    icon: '📈',
  },
  {
    id: 'fundamental',
    label: 'Phân tích cơ bản',
    icon: '🏢',
  },
  {
    id: 'courses',
    label: 'Khóa học',
    icon: '🎓',
  },
];

const RESOURCES = [
  // ── Cơ bản ──
  {
    category: 'beginner',
    type: 'video',
    title: 'Chứng khoán là gì? Hướng dẫn đầu tư chứng khoán từ A-Z cho người mới',
    channel: 'YouTube',
    youtubeId: '8c1rSMYAbIU',
    url: 'https://www.youtube.com/watch?v=8c1rSMYAbIU',
    duration: null,
    level: 'Mới bắt đầu',
  },
  {
    category: 'beginner',
    type: 'video',
    title: 'Cách mở tài khoản chứng khoán & mua cổ phiếu đầu tiên',
    channel: 'YouTube',
    youtubeId: 'yFaCxi8Cq7o',
    url: 'https://www.youtube.com/watch?v=yFaCxi8Cq7o',
    duration: null,
    level: 'Mới bắt đầu',
  },
  {
    category: 'beginner',
    type: 'video',
    title: 'VN-Index là gì? Cách đọc bảng điện tử chứng khoán',
    channel: 'YouTube',
    youtubeId: 'TaiZS8-i6L0',
    url: 'https://www.youtube.com/watch?v=TaiZS8-i6L0',
    duration: null,
    level: 'Mới bắt đầu',
  },
  {
    category: 'beginner',
    type: 'video',
    title: 'Kiến thức cơ bản về đầu tư chứng khoán cho người mới',
    channel: 'YouTube',
    youtubeId: 'UB3RZ7RzJc8',
    url: 'https://www.youtube.com/watch?v=UB3RZ7RzJc8',
    duration: null,
    level: 'Cơ bản',
  },

  // ── Phân tích kỹ thuật ──
  {
    category: 'technical',
    type: 'video',
    title: 'Phân tích kỹ thuật cơ bản: Nến Nhật, Hỗ trợ & Kháng cự',
    channel: 'YouTube',
    youtubeId: 'SYt9F_SKk-o',
    url: 'https://www.youtube.com/watch?v=SYt9F_SKk-o',
    duration: null,
    level: 'Trung cấp',
  },
  {
    category: 'technical',
    type: 'video',
    title: 'RSI, MACD — Chỉ báo kỹ thuật quan trọng nhất',
    channel: 'YouTube',
    youtubeId: '6gmypceM0D4',
    url: 'https://www.youtube.com/watch?v=6gmypceM0D4',
    duration: null,
    level: 'Trung cấp',
  },
  {
    category: 'technical',
    type: 'video',
    title: 'Hướng dẫn phân tích kỹ thuật chứng khoán Việt Nam',
    channel: 'YouTube',
    youtubeId: 'zAx9bcvj83Y',
    url: 'https://www.youtube.com/watch?v=zAx9bcvj83Y',
    duration: null,
    level: 'Trung cấp',
  },
  {
    category: 'technical',
    type: 'video',
    title: 'Phân tích kỹ thuật nâng cao — Mô hình giá & xu hướng',
    channel: 'YouTube',
    youtubeId: 'XHZHaUhgfNE',
    url: 'https://www.youtube.com/watch?v=XHZHaUhgfNE',
    duration: null,
    level: 'Nâng cao',
  },

  // ── Phân tích cơ bản ──
  {
    category: 'fundamental',
    type: 'video',
    title: 'Đọc báo cáo tài chính doanh nghiệp từ đầu đến cuối',
    channel: 'YouTube',
    youtubeId: 'tPWVzRQHDZA',
    url: 'https://www.youtube.com/watch?v=tPWVzRQHDZA',
    duration: null,
    level: 'Trung cấp',
  },
  {
    category: 'fundamental',
    type: 'video',
    title: 'Phân tích cổ phiếu cơ bản — P/E, P/B, ROE là gì?',
    channel: 'YouTube',
    youtubeId: 'qBFnQEvPxjY',
    url: 'https://www.youtube.com/watch?v=qBFnQEvPxjY',
    duration: null,
    level: 'Trung cấp',
  },
  {
    category: 'fundamental',
    type: 'video',
    title: 'Cách phân tích ngành và chọn cổ phiếu dẫn đầu',
    channel: 'YouTube',
    youtubeId: '3G6wzZEkcDw',
    url: 'https://www.youtube.com/watch?v=3G6wzZEkcDw',
    duration: null,
    level: 'Nâng cao',
  },
  {
    category: 'fundamental',
    type: 'video',
    title: 'Phân tích cơ bản chứng khoán — Đầu tư giá trị',
    channel: 'YouTube',
    youtubeId: 'dyM2AwQjOik',
    url: 'https://www.youtube.com/watch?v=dyM2AwQjOik',
    duration: null,
    level: 'Nâng cao',
  },

  // ── Khóa học ──
  {
    category: 'courses',
    type: 'course',
    title: 'Khóa học Đầu tư Chứng khoán từ A-Z',
    provider: 'Kyna.vn',
    description: 'Hơn 50 bài học video, từ cơ bản đến nâng cao. Phù hợp người mới hoàn toàn.',
    url: 'https://kyna.vn/khoa-hoc-dau-tu-chung-khoan',
    affiliateUrl: 'https://kyna.vn/khoa-hoc-dau-tu-chung-khoan', // thay bằng link affiliate của bạn
    price: '499.000đ',
    badge: 'Phổ biến',
    badgeColor: 'var(--bull)',
  },
  {
    category: 'courses',
    type: 'course',
    title: 'Phân tích kỹ thuật chứng khoán chuyên sâu',
    provider: 'Udemy',
    description: 'Khóa học quốc tế về technical analysis, có phụ đề tiếng Việt. 12 giờ nội dung.',
    url: 'https://www.udemy.com/course/technical-analysis-masterclass/',
    affiliateUrl: 'https://www.udemy.com/course/technical-analysis-masterclass/', // thay bằng link affiliate Udemy
    price: 'Từ 299.000đ',
    badge: 'Bán chạy',
    badgeColor: 'var(--gold)',
  },
  {
    category: 'courses',
    type: 'course',
    title: 'Chứng chỉ CFA Level 1 — Tự học online',
    provider: 'Bloomberg Market Concepts',
    description: 'Nền tảng kiến thức tài chính chuyên sâu theo chuẩn quốc tế CFA.',
    url: 'https://www.bloomberg.com/professional/product/bloomberg-market-concepts/',
    affiliateUrl: 'https://www.bloomberg.com/professional/product/bloomberg-market-concepts/',
    price: 'Từ 150 USD',
    badge: 'Nâng cao',
    badgeColor: 'var(--text-muted)',
  },
  {
    category: 'courses',
    type: 'course',
    title: 'Học đầu tư chứng khoán miễn phí — SSI iLearn',
    provider: 'SSI Securities',
    description: 'Nền tảng học miễn phí của công ty chứng khoán SSI, nhiều tài liệu hay.',
    url: 'https://ilearn.ssi.com.vn/',
    affiliateUrl: 'https://ilearn.ssi.com.vn/',
    price: 'Miễn phí',
    badge: 'Miễn phí',
    badgeColor: 'var(--bull)',
  },
];

const LEVEL_COLORS = {
  'Mới bắt đầu': { color: 'var(--bull)', bg: 'var(--bull-dim)' },
  'Cơ bản': { color: 'var(--bull)', bg: 'var(--bull-dim)' },
  'Trung cấp': { color: 'var(--gold)', bg: 'var(--gold-subtle)' },
  'Nâng cao': { color: 'var(--bear)', bg: 'var(--bear-dim)' },
};

function VideoCard({ item }) {
  const [playing, setPlaying] = useState(false);
  const level = LEVEL_COLORS[item.level] ?? LEVEL_COLORS['Cơ bản'];

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Thumbnail / player */}
      <div
        style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', cursor: 'pointer' }}
        onClick={() => setPlaying(true)}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
              alt={item.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Play button overlay */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', transition: 'background 0.15s',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', paddingLeft: '4px',
              }}>
                ▶
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {item.channel}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>· {item.duration}</span>
          <span className="font-mono" style={{ fontSize: '10px', fontWeight: 600, color: level.color, background: level.bg, padding: '1px 6px', borderRadius: '3px', marginLeft: 'auto' }}>
            {item.level}
          </span>
        </div>

        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
          {item.title}
        </p>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none', marginTop: 'auto' }}
        >
          Xem trên YouTube →
        </a>
      </div>
    </div>
  );
}

function CourseCard({ item }) {
  return (
    <a
      href={item.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="card"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gold-dim)';
          e.currentTarget.style.background = 'var(--bg-elevated)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--bg-border)';
          e.currentTarget.style.background = 'var(--bg-surface)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.provider}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: '10px', fontWeight: 700, color: item.badgeColor, background: item.badgeColor === 'var(--gold)' ? 'var(--gold-subtle)' : item.badgeColor === 'var(--bull)' ? 'var(--bull-dim)' : 'rgba(74,85,104,0.15)', padding: '2px 7px', borderRadius: '4px' }}
            >
              {item.badge}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
            {item.price}
          </span>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {item.title}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {item.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)' }}>Xem khóa học →</span>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>affiliate link</span>
        </div>
      </div>
    </a>
  );
}

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState('beginner');

  const filtered = RESOURCES.filter((r) => r.category === activeCategory);
  const videos = filtered.filter((r) => r.type === 'video');
  const courses = filtered.filter((r) => r.type === 'course');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>

      {/* Header */}
      <div>
        <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '4px' }}>Học đầu tư</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Video & khóa học chứng khoán được tuyển chọn
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-sm)', padding: '4px', alignSelf: 'flex-start' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeCategory === cat.id ? 'var(--gold-dim)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--gold-light)' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {videos.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            Video hướng dẫn
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {videos.map((item, i) => (
              <VideoCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Courses list */}
      {courses.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            Khóa học có phí
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {courses.map((item, i) => (
              <CourseCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '8px', borderTop: '1px solid var(--bg-border)' }}>
        * Một số liên kết ở trên là affiliate link. Finsight có thể nhận hoa hồng khi bạn đăng ký qua link này, không phát sinh thêm chi phí cho bạn.
      </p>
    </div>
  );
}
