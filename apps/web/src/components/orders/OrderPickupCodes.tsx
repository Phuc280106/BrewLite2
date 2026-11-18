'use client';

import React, { useMemo } from 'react';

interface PickupQrSvgProps {
  value: string;
  size?: number;
}

/**
 * Tạo ma trận QR 21×21 ổn định (deterministic) theo mã đơn hàng
 * với đầy đủ 3 ô định vị góc chuẩn QR để hiển thị sắc nét không phụ thuộc URL tạm.
 */
function buildQrMatrix(seedText: string): boolean[][] {
  const N = 21;
  const grid: boolean[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => false),
  );
  const reserved: boolean[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => false),
  );

  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const rr = startRow + r;
        const cc = startCol + c;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        reserved[rr][cc] = true;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const isInside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        grid[rr][cc] = isInside && (isBorder || isCenter);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i += 1) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic PRNG seeded by order code
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  const nextBit = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100) < 48;
  };

  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      if (!reserved[r][c]) {
        grid[r][c] = nextBit();
      }
    }
  }

  return grid;
}

export const PickupQrSvg: React.FC<PickupQrSvgProps> = ({
  value,
  size = 116,
}) => {
  const matrix = useMemo(() => buildQrMatrix(value), [value]);
  const cells = 21;
  const padding = 1;
  const viewBoxSize = cells + padding * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label={`Mã QR nhận món ${value}`}
      className="block shrink-0 rounded-lg bg-white"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
      {matrix.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + padding}
              y={rIdx + padding}
              width={1}
              height={1}
              fill="#111111"
            />
          ) : null,
        ),
      )}
    </svg>
  );
};

interface PickupBarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
}

/**
 * Tạo vạch mã vạch kiểu Code 128 ổn định theo mã đơn hàng (matching Figma 14:109).
 */
export const PickupBarcodeSvg: React.FC<PickupBarcodeSvgProps> = ({
  value,
  width = 154,
  height = 30,
}) => {
  const bars = useMemo(() => {
    const result: Array<{ x: number; w: number }> = [];
    const normalized = value.replace(/[^A-Z0-9]/gi, '') || '8921';
    let x = 2;

    // Guard start pattern
    const startWidths = [2, 1, 1, 2, 3, 1];
    startWidths.forEach((w, idx) => {
      if (idx % 2 === 0) result.push({ x, w });
      x += w;
    });

    // Data bars derived deterministically from order code characters
    for (let i = 0; i < 18; i += 1) {
      const ch = normalized.charCodeAt(i % normalized.length) + i * 13;
      const barW = (ch % 3) + 1;
      const gapW = ((ch >> 2) % 2) + 1;
      if (x + barW > 142) break;
      result.push({ x, w: barW });
      x += barW + gapW;
    }

    // Guard end pattern
    if (x < 146) {
      result.push({ x: 144, w: 2 });
      result.push({ x: 148, w: 1 });
      result.push({ x: 150, w: 2 });
    }

    return result;
  }, [value]);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 154 30"
      role="img"
      aria-label={`Mã vạch nhận món ${value}`}
      className="block shrink-0"
    >
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={0}
          width={bar.w}
          height={30}
          fill="#111111"
        />
      ))}
    </svg>
  );
};
