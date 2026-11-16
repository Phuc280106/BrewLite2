import React from 'react';
import useSWR from 'swr';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import { Skeleton, EmptyState, ErrorState } from '@/components/UIStates';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MenuPage() {
  const { data, error, isLoading } = useSWR<Product[]>('http://localhost:3001/products', fetcher);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>BrewLite Menu</h1>
      <CategoryFilter />
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {data.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
