import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  applyDateFilter,
  buildBudgetSummaryParams,
  buildQueryParams,
  getInitialFilters,
  getMonthBoundaries,
  isSameMonth,
  nextSortDir,
} from "@/lib/expenseFilters";
import { Filters } from "@/types";

const base: Filters = {
  ...DEFAULT_FILTERS,
  spent_at_after: "2026-03-01",
  spent_at_before: "2026-03-31",
};

describe("isSameMonth", () => {
  it("YYYY-MM이 같으면 true", () => {
    expect(isSameMonth("2026-03-01", "2026-03-31")).toBe(true);
    expect(isSameMonth("2026-03-31", "2026-04-01")).toBe(false);
  });

  it("한쪽이 비어 있으면 보정이 필요 없으므로 true", () => {
    expect(isSameMonth("", "2026-04-01")).toBe(true);
    expect(isSameMonth("2026-04-01", "")).toBe(true);
  });
});

describe("getMonthBoundaries", () => {
  it("31일 달의 경계를 구한다", () => {
    expect(getMonthBoundaries("2026-03-15")).toEqual({
      first: "2026-03-01",
      last: "2026-03-31",
    });
  });

  it("윤년 2월의 말일은 29일", () => {
    expect(getMonthBoundaries("2024-02-10")).toEqual({
      first: "2024-02-01",
      last: "2024-02-29",
    });
  });
});

describe("getInitialFilters", () => {
  it("주어진 날짜가 속한 달의 1일~말일로 채운다", () => {
    const filters = getInitialFilters(new Date(2026, 1, 17)); // 2026-02-17
    expect(filters.spent_at_after).toBe("2026-02-01");
    expect(filters.spent_at_before).toBe("2026-02-28");
    expect(filters.category).toEqual([]);
  });
});

describe("applyDateFilter", () => {
  it("시작일을 다른 달로 바꾸면 종료일을 그 달 말일로 보정한다", () => {
    const next = applyDateFilter(base, "spent_at_after", "2026-05-10");
    expect(next.spent_at_after).toBe("2026-05-10");
    expect(next.spent_at_before).toBe("2026-05-31");
  });

  it("같은 달 안에서 시작일이 종료일보다 늦으면 종료일을 시작일로 맞춘다", () => {
    const next = applyDateFilter(
      { ...base, spent_at_before: "2026-03-10" },
      "spent_at_after",
      "2026-03-20"
    );
    expect(next.spent_at_before).toBe("2026-03-20");
  });

  it("종료일을 다른 달로 바꾸면 시작일을 그 달 1일로 보정한다", () => {
    const next = applyDateFilter(base, "spent_at_before", "2026-01-20");
    expect(next.spent_at_after).toBe("2026-01-01");
    expect(next.spent_at_before).toBe("2026-01-20");
  });

  it("날짜가 아닌 필터는 그대로 반영하고 날짜는 건드리지 않는다", () => {
    const next = applyDateFilter(base, "category", ["food", "cafe"]);
    expect(next.category).toEqual(["food", "cafe"]);
    expect(next.spent_at_after).toBe("2026-03-01");
    expect(next.spent_at_before).toBe("2026-03-31");
  });

  it("원본 필터를 변경하지 않는다", () => {
    applyDateFilter(base, "spent_at_after", "2026-05-10");
    expect(base.spent_at_before).toBe("2026-03-31");
  });
});

describe("buildQueryParams", () => {
  it("빈 값은 쿼리에 넣지 않는다", () => {
    const query = buildQueryParams(DEFAULT_FILTERS, 1, 20, "spent_at", "desc");
    const params = new URLSearchParams(query);
    expect([...params.keys()]).toEqual(["page", "page_size", "ordering"]);
  });

  it("배열 필터는 쉼표로 join한다", () => {
    const query = buildQueryParams(
      { ...base, category: ["food", "cafe"], payment_method: ["card"] },
      2,
      50,
      "amount",
      "asc"
    );
    const params = new URLSearchParams(query);
    expect(params.get("category")).toBe("food,cafe");
    expect(params.get("payment_method")).toBe("card");
    expect(params.get("page")).toBe("2");
    expect(params.get("page_size")).toBe("50");
  });

  it("내림차순은 ordering 앞에 -를 붙인다", () => {
    const asc = new URLSearchParams(
      buildQueryParams(base, 1, 20, "amount", "asc")
    );
    const desc = new URLSearchParams(
      buildQueryParams(base, 1, 20, "amount", "desc")
    );
    expect(asc.get("ordering")).toBe("amount");
    expect(desc.get("ordering")).toBe("-amount");
  });
});

describe("buildBudgetSummaryParams", () => {
  it("시작일에서 기준 연/월을 뽑는다", () => {
    const params = new URLSearchParams(buildBudgetSummaryParams(base));
    expect(params.get("year")).toBe("2026");
    expect(params.get("month")).toBe("3");
    expect(params.get("spent_at_before")).toBe("2026-03-31");
  });

  it("시작일이 없으면 오늘을 기준으로 한다", () => {
    const params = new URLSearchParams(
      buildBudgetSummaryParams(DEFAULT_FILTERS, new Date(2026, 10, 5))
    );
    expect(params.get("year")).toBe("2026");
    expect(params.get("month")).toBe("11");
    expect(params.has("spent_at_after")).toBe(false);
  });
});

describe("nextSortDir", () => {
  it("같은 컬럼을 다시 누르면 방향을 뒤집는다", () => {
    expect(nextSortDir("spent_at", "asc", "spent_at")).toBe("desc");
    expect(nextSortDir("spent_at", "desc", "spent_at")).toBe("asc");
  });

  it("다른 컬럼이면 오름차순부터 시작한다", () => {
    expect(nextSortDir("spent_at", "desc", "amount")).toBe("asc");
  });
});
