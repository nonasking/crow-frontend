import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEARCH_DEBOUNCE_MS, useStore } from "@/store/useStore";
import { getInitialFilters } from "@/lib/expenseFilters";

const LIST_RESPONSE = {
  count: 2,
  next: "/api/expenses/expenses/?page=2",
  previous: null,
  results: [
    { id: 1, spent_at: "2026-03-02", category: "food", sub_category: "cafe", item: "라떼", payment_method: "card", amount: 4500, memo: "" },
    { id: 2, spent_at: "2026-03-01", category: "food", sub_category: "lunch", item: "김밥", payment_method: "cash", amount: 6000, memo: "" },
  ],
};

/** 호출된 URL만 기록하는 fetch 스텁. 모든 응답은 200 + 빈 객체(또는 지정한 본문). */
function stubFetch(body: unknown = {}, ok = true) {
  const spy = vi.fn<typeof fetch>(async () =>
    ok ? Response.json(body) : Response.json({ detail: "nope" }, { status: 500 })
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

/** fetchExpenses가 호출한 목록 URL(첫 호출)의 쿼리 파라미터 */
function listParams(spy: ReturnType<typeof stubFetch>) {
  const url = String(spy.mock.calls[0][0]);
  return new URLSearchParams(url.split("?")[1] ?? "");
}

const INITIAL = useStore.getState();

beforeEach(() => {
  useStore.setState({
    ...INITIAL,
    filters: getInitialFilters(),
    expenses: [],
    pagination: { count: 0, next: null, previous: null },
    page: 1,
    pageSize: 20,
    sortKey: "spent_at",
    sortDir: "desc",
    error: null,
    loading: false,
    budgetSummary: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchExpenses", () => {
  it("응답을 목록과 페이지네이션으로 반영하고 loading을 내린다", async () => {
    stubFetch(LIST_RESPONSE);

    await useStore.getState().fetchExpenses();

    const state = useStore.getState();
    expect(state.expenses).toHaveLength(2);
    expect(state.pagination).toEqual({
      count: 2,
      next: "/api/expenses/expenses/?page=2",
      previous: null,
    });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("현재 필터/정렬/페이지를 쿼리로 실어 보낸다", async () => {
    const spy = stubFetch(LIST_RESPONSE);
    useStore.setState({ page: 3, pageSize: 50, sortKey: "amount", sortDir: "asc" });

    await useStore.getState().fetchExpenses();

    const params = listParams(spy);
    expect(params.get("page")).toBe("3");
    expect(params.get("page_size")).toBe("50");
    expect(params.get("ordering")).toBe("amount");
  });

  it("실패하면 error를 채우고 loading을 내린다", async () => {
    stubFetch(undefined, false);

    await useStore.getState().fetchExpenses();

    const state = useStore.getState();
    expect(state.error).toContain("HTTP 500");
    expect(state.loading).toBe(false);
    expect(state.expenses).toEqual([]);
  });
});

describe("setSort", () => {
  it("같은 컬럼을 다시 누르면 방향만 뒤집는다", () => {
    stubFetch(LIST_RESPONSE);
    useStore.setState({ sortKey: "spent_at", sortDir: "desc" });

    useStore.getState().setSort("spent_at");

    expect(useStore.getState().sortDir).toBe("asc");
  });

  it("다른 컬럼을 누르면 오름차순으로 시작하고 1페이지로 돌아간다", () => {
    stubFetch(LIST_RESPONSE);
    useStore.setState({ page: 4, sortKey: "spent_at", sortDir: "desc" });

    useStore.getState().setSort("amount");

    const state = useStore.getState();
    expect(state.sortKey).toBe("amount");
    expect(state.sortDir).toBe("asc");
    expect(state.page).toBe(1);
  });
});

describe("setFilter", () => {
  it("필터를 바꾸면 1페이지로 돌아가고 재조회한다", async () => {
    const spy = stubFetch(LIST_RESPONSE);
    useStore.setState({ page: 5 });

    useStore.getState().setFilter("search", "커피");
    await vi.waitFor(() => expect(spy).toHaveBeenCalled());

    const state = useStore.getState();
    expect(state.filters.search).toBe("커피");
    expect(state.page).toBe(1);
    expect(listParams(spy).get("search")).toBe("커피");
  });

  it("여러 달에 걸친 기간을 그대로 유지하고 쿼리에 싣는다", () => {
    const spy = stubFetch(LIST_RESPONSE);
    useStore.setState({
      filters: { ...INITIAL.filters, spent_at_after: "2026-03-01", spent_at_before: "2026-03-31" },
    });

    useStore.getState().setFilter("spent_at_after", "2025-01-01");
    useStore.getState().setFilter("spent_at_before", "2026-08-15");

    const { filters } = useStore.getState();
    expect(filters.spent_at_after).toBe("2025-01-01");
    expect(filters.spent_at_before).toBe("2026-08-15");
    const lastList = spy.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.startsWith("/api/expenses/expenses/?"))
      .at(-1)!;
    const params = new URLSearchParams(lastList.split("?")[1]);
    expect(params.get("spent_at_after")).toBe("2025-01-01");
    expect(params.get("spent_at_before")).toBe("2026-08-15");
  });
});

describe("resetFilters / 페이지네이션", () => {
  it("resetFilters는 모든 필터를 비우고 1페이지로 돌아간다", () => {
    stubFetch(LIST_RESPONSE);
    useStore.setState({ page: 7 });

    useStore.getState().resetFilters();

    const state = useStore.getState();
    expect(state.filters.spent_at_after).toBe("");
    expect(state.filters.category).toEqual([]);
    expect(state.filters.search).toBe("");
    expect(state.page).toBe(1);
  });

  it("setPage는 페이지만 바꾼다", () => {
    stubFetch(LIST_RESPONSE);

    useStore.getState().setPage(3);

    expect(useStore.getState().page).toBe(3);
  });

  it("setPageSize는 페이지 크기를 바꾸고 1페이지로 돌아간다", () => {
    stubFetch(LIST_RESPONSE);
    useStore.setState({ page: 6 });

    useStore.getState().setPageSize(100);

    const state = useStore.getState();
    expect(state.pageSize).toBe(100);
    expect(state.page).toBe(1);
  });
});

describe("createExpense / deleteExpenses", () => {
  it("생성에 실패하면 백엔드 에러 본문을 담아 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ amount: ["This field is required."] }, { status: 400 })
      )
    );

    await expect(
      useStore.getState().createExpense({
        spent_at: "2026-03-01",
        category: "food",
        sub_category: "cafe",
        item: "라떼",
        payment_method: "card",
        amount: 0,
        memo: "",
      })
    ).rejects.toThrow(/This field is required/);
  });

  it("여러 건 삭제는 id마다 DELETE를 보내고 목록을 다시 읽는다", async () => {
    const spy = stubFetch(LIST_RESPONSE);

    await useStore.getState().deleteExpenses([1, 2]);

    const deletes = spy.mock.calls.filter(([, init]) => init?.method === "DELETE");
    expect(deletes).toHaveLength(2);
    expect(String(deletes[0][0])).toBe("/api/expenses/expenses/1/");
    expect(String(deletes[1][0])).toBe("/api/expenses/expenses/2/");
    expect(useStore.getState().expenses).toHaveLength(2);
  });
});

describe("동시 요청 / 디바운스", () => {
  it("늦게 도착한 옛 목록 응답은 최신 결과를 덮어쓰지 않는다", async () => {
    const resolvers: ((r: Response) => void)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (String(url).includes("/summary/")) return Promise.resolve(Response.json({}));
        return new Promise<Response>((resolve) => resolvers.push(resolve));
      })
    );

    const first = useStore.getState().fetchExpenses();
    const second = useStore.getState().fetchExpenses();
    await vi.waitFor(() => expect(resolvers).toHaveLength(2));

    // 최신 요청이 먼저 끝나고, 옛 요청이 나중에 끝난다.
    resolvers[1](Response.json({ ...LIST_RESPONSE, count: 1, results: [LIST_RESPONSE.results[0]] }));
    await second;
    resolvers[0](Response.json(LIST_RESPONSE));
    await first;

    expect(useStore.getState().expenses.map((e) => e.id)).toEqual([1]);
    expect(useStore.getState().loading).toBe(false);
  });

  it("검색어 입력은 타이핑이 멈춘 뒤 한 번만 조회한다", async () => {
    vi.useFakeTimers();
    try {
      const spy = stubFetch(LIST_RESPONSE);
      for (const q of ["스", "스타", "스타벅스"]) useStore.getState().setFilter("search", q);

      expect(useStore.getState().filters.search).toBe("스타벅스");
      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
      const lists = spy.mock.calls.filter(([url]) => !String(url).includes("/summary/"));
      expect(lists).toHaveLength(1);
      expect(listParams(spy).get("search")).toBe("스타벅스");
    } finally {
      vi.useRealTimers();
    }
  });

  it("setFilters는 여러 필터를 바꾸고 한 번만 조회한다", async () => {
    const spy = stubFetch(LIST_RESPONSE);

    useStore.getState().setFilters({ category: ["food"], sub_category: ["cafe"] });
    await vi.waitFor(() => expect(spy).toHaveBeenCalled());

    const lists = spy.mock.calls.filter(([url]) => !String(url).includes("/summary/"));
    expect(lists).toHaveLength(1);
    expect(listParams(spy).getAll("category")).toEqual(["food"]);
    expect(useStore.getState().filters.sub_category).toEqual(["cafe"]);
  });
});

describe("deleteExpenses 실패 처리", () => {
  it("일부 삭제가 실패하면 목록은 다시 읽고 실패한 id를 담아 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "DELETE") {
          return String(url).endsWith("/2/")
            ? Response.json({ detail: "nope" }, { status: 500 })
            : new Response(null, { status: 204 });
        }
        return Response.json(LIST_RESPONSE);
      })
    );

    await expect(useStore.getState().deleteExpenses([1, 2])).rejects.toThrow(/1건 삭제 실패 \(id: 2\)/);
    expect(useStore.getState().expenses).toHaveLength(2);
  });
});
