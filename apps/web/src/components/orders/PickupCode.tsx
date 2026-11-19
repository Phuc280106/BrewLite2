import React from 'react';

/** Băm chuỗi thành dãy bit ổn định để vẽ mã giả lập (không phải mã QR/barcode thật). */
function bits(seed: string, count: number): number[] {
  let h = 2166136261;
  const out: number[] = [];
  for (let i = 0; out.length < count; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out.push(h & 1, (h >>> 7) & 1, (h >>> 13) & 1);
  }
  return out.slice(0, count);
}

export function QrPlaceholder({ seed, size = 84 }: { seed: string; size?: number }) {
  const n = 21;
  const data = bits(seed, n * n);
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  const cells: React.ReactElement[] = [];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!inFinder(x, y) && data[y * n + x]) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
      }
    }
  }
  const finder = (ox: number, oy: number) => (
    <g key={`f${ox}${oy}`}>
      <rect x={ox} y={oy} width="7" height="7" />
      <rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width="3" height="3" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} fill="#3D2615" aria-label="Mã QR nhận món (mô phỏng)" role="img">
      {cells}
      {finder(0, 0)}
      {finder(n - 7, 0)}
      {finder(0, n - 7)}
    </svg>
  );
}

export function BarcodePlaceholder({ seed, width = 160, height = 36 }: { seed: string; width?: number; height?: number }) {
  const data = bits(seed + 'bar', 48);
  let x = 0;
  const bars: React.ReactElement[] = [];
  data.forEach((b, i) => {
    const w = 1 + (i % 3 === 0 ? 1 : 0) + b;
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y="0" width={w} height={height} />);
    x += w;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" fill="#1c1917" aria-hidden="true">
      {bars}
    </svg>
  );
}
