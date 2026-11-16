import React from 'react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
      <h2>{product.name}</h2>
      {product.imageUrl && (
        <Image src={product.imageUrl} alt={product.name} width={200} height={150} style={{ objectFit: 'cover' }} />
      )}
      {product.description && <p>{product.description}</p>}
      <p>Giá: {product.price.toLocaleString()} VND</p>
      {product.category && <p>Danh mục: {product.category}</p>}
    </div>
  );
}
