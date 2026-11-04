import { describe, expect, it } from "vitest";
import { CHART_COLORS, formatKRW, formatKRWFull, getColor } from "@/lib/chartUtils";
import { toBarData, toPieData } from "@/lib/chartUtils";

describe("getColor", () => {
  it("팔레트 길이를 넘어가면 순환한다", () => {
    expect(getColor(0)).toBe(CHART_COLORS[0]);
    expect(getColor(CHART_COLORS.length)).toBe(CHART_COLORS[0]);
    expect(getColor(CHART_COLORS.length + 3)).toBe(CHART_COLORS[3]);
  });
});

describe("formatKRW", () => {
  it("백만 단위는 M, 천 단위는 K로 줄인다", () => {
    expect(formatKRW(2_500_000)).toBe("2.5M");
    expect(formatKRW(1_000_000)).toBe("1.0M");
    expect(formatKRW(12_300)).toBe("12K");
  });

  it("천 미만은 그대로 표시한다", () => {
    expect(formatKRW(999)).toBe("999");
    expect(formatKRW(0)).toBe("0");
  });
});

describe("formatKRWFull", () => {
  it("천 단위 구분자와 원을 붙인다", () => {
    expect(formatKRWFull(1_234_567)).toBe("1,234,567원");
    expect(formatKRWFull(0)).toBe("0원");
  });
});


describe("toPieData", () => {
  const bd = (cats: [string, number][]) => ({
    total: cats.reduce((s, [, t]) => s + t, 0),
    count: cats.length,
    by_category: cats.map(([label, total]) => ({ category: label, label, total, count: 1 })),
    by_month: [],
  });

  it("라벨과 비율(양수 합계 기준)", () => {
    const { data, excluded } = toPieData(bd([["식대", 3000], ["교통비", 1000]]));
    expect(data.map((d) => [d.name, d.pct])).toEqual([["식대", 75], ["교통비", 25]]);
    expect(excluded).toEqual([]);
  });

  it("합계가 0 이하인 대분류는 빼고 알려 준다 (비율이 100%를 넘지 않게)", () => {
    const { data, excluded } = toPieData(bd([["식대", 10000], ["기타", -4000], ["미상", 0]]));
    expect(data).toEqual([{ name: "식대", value: 10000, pct: 100 }]);
    expect(excluded).toEqual(["기타", "미상"]);
  });

  it("집계가 없으면 빈 데이터", () => {
    expect(toPieData(null)).toEqual({ data: [], excluded: [] });
  });
});

describe("toBarData", () => {
  it("YY-MM 라벨과 절댓값 기준 진하기 (음수 달도 보인다)", () => {
    const data = toBarData({
      total: 0, count: 0, by_category: [],
      by_month: [
        { month: "2026-03", total: 2000, count: 1 },
        { month: "2026-04", total: -1000, count: 1 },
      ],
    });
    expect(data.map((d) => d.month)).toEqual(["26-03", "26-04"]);
    expect(data[0].opacity).toBeCloseTo(1);
    expect(data[1].opacity).toBeCloseTo(0.65);
    expect(data.every((d) => d.opacity > 0)).toBe(true);
  });
});
