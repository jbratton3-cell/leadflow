"use client";

import { useId, useState } from "react";

type Point = { label: string; value: number };

const fmtNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`;

const fmtMoney = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`;

// Serializable formatter selector so Server Components can pass a string
// (functions can't cross the server→client boundary).
export type ValueFormat = "number" | "money";
const applyFormat = (fmt: ValueFormat | undefined, n: number) =>
  fmt === "money" ? fmtMoney(n) : fmtNum(n);

/* ------------------------------ Line Chart ----------------------------- */

export function LineChart({
  data,
  color = "#f97316",
  height = 220,
  format,
}: {
  data: Point[];
  color?: string;
  height?: number;
  format?: ValueFormat;
}) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const w = 520;
  const h = height;
  const padX = 36;
  const padY = 24;

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const fmt = (n: number) => applyFormat(format, n);
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padY + innerH - ((v - min) / (max - min || 1)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padY + innerH} L ${x(0)} ${padY + innerH} Z`;

  // horizontal gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => {
        const gy = padY + innerH - g * innerH;
        return (
          <g key={i}>
            <line x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padX - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {fmt(max * g)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={x(i)}
            cy={y(d.value)}
            r={hover === i ? 5 : 3.5}
            fill="#fff"
            stroke={color}
            strokeWidth="2"
          />
          <rect
            x={x(i) - stepX / 2}
            y={padY}
            width={stepX || innerW}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
          <text x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="#64748b">
            {d.label}
          </text>
          {hover === i && (
            <g>
              <rect
                x={Math.min(Math.max(x(i) - 30, 2), w - 62)}
                y={y(d.value) - 26}
                width="60"
                height="18"
                rx="4"
                fill="#0f172a"
              />
              <text
                x={Math.min(Math.max(x(i), 32), w - 32)}
                y={y(d.value) - 13}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
                fontWeight="600"
              >
                {fmt(d.value)}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------ Bar Chart ------------------------------ */

export function BarChart({
  data,
  color = "#10b981",
  height = 220,
  format,
}: {
  data: Point[];
  color?: string;
  height?: number;
  format?: ValueFormat;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 520;
  const h = height;
  const padX = 40;
  const padY = 24;

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.6, 46);
  const fmt = (n: number) => applyFormat(format, n);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {gridLines.map((g, i) => {
        const gy = padY + innerH - g * innerH;
        return (
          <g key={i}>
            <line x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padX - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {fmt(max * g)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const bh = (d.value / max) * innerH;
        const bx = padX + i * slot + (slot - barW) / 2;
        const by = padY + innerH - bh;
        return (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <rect
              x={bx}
              y={by}
              width={barW}
              height={bh}
              rx="4"
              fill={color}
              opacity={hover === null || hover === i ? 1 : 0.55}
            />
            <text x={bx + barW / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="#64748b">
              {d.label}
            </text>
            {hover === i && (
              <text
                x={bx + barW / 2}
                y={by - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#0f172a"
                fontWeight="700"
              >
                {fmt(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------- Horizontal Bars ---------------------------- */

export function HorizontalBarChart({
  data,
  color = "#6366f1",
  format,
}: {
  data: Point[];
  color?: string;
  format?: ValueFormat;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = (n: number) => applyFormat(format, n);

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-slate-500" title={d.label}>
            {d.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className="flex h-full items-center justify-end rounded px-2"
              style={{ width: `${Math.max((d.value / max) * 100, 6)}%`, backgroundColor: color }}
            >
              <span className="text-[10px] font-semibold text-white">{fmt(d.value)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Donut ---------------------------------- */

type Slice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 180,
  centerLabel,
  centerValue,
}: {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;
  const stroke = size * 0.16;
  const r = radius - stroke / 2;
  const circ = 2 * Math.PI * r;

  if (total === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }

  let offset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const frac = d.value / total;
      const seg = {
        ...d,
        dash: frac * circ,
        gap: circ - frac * circ,
        offset: offset * circ,
        pct: frac * 100,
      };
      offset += frac;
      return seg;
    });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          <circle cx={radius} cy={radius} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={radius}
              cy={radius}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        {(centerValue || centerLabel) && (
          <>
            <text x={radius} y={radius - 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">
              {centerValue}
            </text>
            <text x={radius} y={radius + 16} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {centerLabel}
            </text>
          </>
        )}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-800">{s.value}</span>
            <span className="w-10 text-right text-xs text-slate-400">{s.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Funnel --------------------------------- */

export function FunnelChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981"];
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].value : null;
        const conv = prev && prev > 0 ? (d.value / prev) * 100 : null;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-slate-500">{d.label}</span>
            <div className="flex-1">
              <div
                className="flex h-8 items-center justify-between rounded-lg px-3 text-white"
                style={{
                  width: `${Math.max((d.value / max) * 100, 12)}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              >
                <span className="text-sm font-bold">{d.value}</span>
              </div>
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-medium text-slate-500">
              {conv !== null ? `${conv.toFixed(0)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
