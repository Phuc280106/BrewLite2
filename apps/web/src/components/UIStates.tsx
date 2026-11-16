import React from 'react';

export function Skeleton() {
  return <div>Loading...</div>;
}

export function EmptyState() {
  return <div>No products found.</div>;
}

export function ErrorState() {
  return <div>Failed to load products.</div>;
}
