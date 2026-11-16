import useSWR from 'swr';
import type { NextPage } from 'next';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const { data, error } = useSWR<Product[]>('/api/products', fetcher);

  if (error) return <div>Failed to load products.</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>BrewLite Menu</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {data.map((p) => (
          <li key={p.id} style={{ marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
            <h2>{p.name}</h2>
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', height: 'auto' }} />}
            {p.description && <p>{p.description}</p>}
            <p>Giá: {p.price} VND</p>
            {p.category && <p>Danh mục: {p.category}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
