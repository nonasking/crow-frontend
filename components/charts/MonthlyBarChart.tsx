"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { useStore } from "@/store/useStore";
import { formatKRW, formatKRWFull } from "@/lib/chartUtils";

const CustomTooltip = ({ active, payload, label }: Partial<TooltipContentProps<number, string>>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141418] border border-[#2a2a2e] px-3 py-2 text-xs font-mono">
      <div className="text-[#666] mb-1">{label}</div>
      <div className="text-[#c9a96e]">{formatKRWFull(payload[0].value)}</div>
    </div>
  );
};

export default function MonthlyBarChart() {
  // 현재 페이지(20건)가 아니라 필터에 맞는 전체 지출을 서버에서 집계한 값을 쓴다.
  const { breakdown } = useStore();

  // 서버가 "YYYY-MM" 오름차순으로 준다.
  const data = (breakdown?.by_month ?? []).map((m) => ({
    month: m.month.slice(2), // "YY-MM"
    total: m.total,
  }));

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-[#c0bbb4] text-xs tracking-widest">
        데이터 없음
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-[10px] tracking-widest uppercase text-[#444] font-mono mb-3">
        월별 지출 추이
      </h2>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={Math.max(8, Math.min(24, 200 / data.length))}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "#444", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#c0bbb4", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatKRW}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="total" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill="#c9a96e"
                  opacity={0.3 + 0.7 * (d.total / maxVal)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}