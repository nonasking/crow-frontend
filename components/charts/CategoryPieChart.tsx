"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { useStore } from "@/store/useStore";
import { getColor, formatKRWFull } from "@/lib/chartUtils";

type Entry = { name: string; value: number; pct: number };

const CustomTooltip = ({ active, payload }: Partial<TooltipContentProps<number, string>>) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Entry;
  return (
    <div className="bg-[#141418] border border-[#2a2a2e] px-3 py-2 text-xs font-mono">
      <div className="text-[#e8e4dc] mb-1">{d.name}</div>
      <div className="text-[#c9a96e]">{formatKRWFull(d.value)}</div>
      <div className="text-[#555]">{d.pct.toFixed(1)}%</div>
    </div>
  );
};

type LegendItem = { value?: string; color?: string };

const CustomLegend = ({ payload }: { payload?: readonly LegendItem[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-[#666]">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: entry.color }}
        />
        {entry.value}
      </div>
    ))}
  </div>
);

export default function CategoryPieChart() {
  // 현재 페이지(20건)가 아니라 필터에 맞는 전체 지출을 서버에서 집계한 값을 쓴다.
  const { breakdown } = useStore();

  const total = breakdown?.total ?? 0;
  const data: Entry[] = (breakdown?.by_category ?? []).map((c) => ({
    name: c.label,
    value: c.total,
    pct: total > 0 ? (c.total / total) * 100 : 0,
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-[#c0bbb4] text-xs tracking-widest">
        데이터 없음
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[10px] tracking-widest uppercase text-[#444] font-mono">
          대분류별 지출
        </h2>
        <span className="text-[10px] font-mono text-[#555] tabular-nums">
          {breakdown?.count ?? 0}건
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius="52%"
              outerRadius="72%"
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={getColor(i)} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-1">
        {data.slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: getColor(i) }}
            />
            <span className="text-[#555] flex-1 truncate">{d.name}</span>
            <span className="text-[#888] tabular-nums">{d.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}