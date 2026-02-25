'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Fetch Vietnamese stock market news from Google News RSS feeds.
 * Refreshes every 5 minutes.
 */
export function useNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setArticles(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchNews]);

  return { articles, loading, error };
}
