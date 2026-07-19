import { describe, expect, it } from "vitest";
import { CHART_COLORS, formatKRW, formatKRWFull, getColor } from "@/lib/chartUtils";

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
