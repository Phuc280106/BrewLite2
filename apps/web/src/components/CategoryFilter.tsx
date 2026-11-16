import React from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';

const categories = ['All', 'Tea', 'Coffee', 'Smoothie', 'Juice'];

export default function CategoryFilter() {
  const router = useRouter();
  const [active, setActive] = useState('All');

  const handleClick = (cat: string) => {
    setActive(cat);
    const query = cat === 'All' ? {} : { category: cat };
    router.push({ pathname: '/', query }, undefined, { shallow: true });
  };

  return (
    <nav style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleClick(cat)}
          style={{
            padding: '0.4rem 0.8rem',
            background: active === cat ? '#1976d2' : '#e0e0e0',
            color: active === cat ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}
