import { describe, it, expect } from "vitest";
import { filterOptions, findExactOption } from "@/lib/comboboxFilter";
import { OptionItem } from "@/types";

const OPTIONS: OptionItem[] = [
  { value: "FOOD", label: "식비" },
  { value: "FOOD_OUT", label: "외식" },
  { value: "TRANSPORT", label: "교통" },
  { value: "CULTURE", label: "문화생활" },
  { value: "LIVING", label: "생활용품" },
];

describe("filterOptions", () => {
  it("빈 쿼리는 전체 옵션을 그대로 반환한다", () => {
    expect(filterOptions(OPTIONS, "")).toEqual(OPTIONS);
    expect(filterOptions(OPTIONS, "   ")).toEqual(OPTIONS);
  });

  it("label 부분 일치로 필터링한다", () => {
    const result = filterOptions(OPTIONS, "생활");
    expect(result.map((o) => o.value)).toEqual(["LIVING", "CULTURE"]);
  });

  it("접두 일치가 부분 일치보다 먼저 온다", () => {
    // "생활용품"은 접두 일치, "문화생활"은 부분 일치
    const result = filterOptions(OPTIONS, "생활");
    expect(result[0].value).toBe("LIVING");
  });

  it("value로도 매칭된다 (대소문자 무시)", () => {
    const result = filterOptions(OPTIONS, "food");
    expect(result.map((o) => o.value)).toEqual(["FOOD", "FOOD_OUT"]);
  });

  it("일치하는 옵션이 없으면 빈 배열을 반환한다", () => {
    expect(filterOptions(OPTIONS, "없는카테고리")).toEqual([]);
  });

  it("원본 옵션 순서를 그룹 내에서 유지한다", () => {
    const result = filterOptions(OPTIONS, "o");
    expect(result.map((o) => o.value)).toEqual([
      "FOOD",
      "FOOD_OUT",
      "TRANSPORT",
    ]);
  });
});

describe("findExactOption", () => {
  it("label 정확 일치 옵션을 반환한다", () => {
    expect(findExactOption(OPTIONS, "식비")?.value).toBe("FOOD");
  });

  it("value 정확 일치도 허용한다 (대소문자 무시)", () => {
    expect(findExactOption(OPTIONS, "transport")?.value).toBe("TRANSPORT");
  });

  it("앞뒤 공백을 무시한다", () => {
    expect(findExactOption(OPTIONS, " 외식 ")?.value).toBe("FOOD_OUT");
  });

  it("부분 일치는 정확 일치가 아니다", () => {
    expect(findExactOption(OPTIONS, "생활")).toBeNull();
  });

  it("빈 쿼리는 null을 반환한다", () => {
    expect(findExactOption(OPTIONS, "")).toBeNull();
    expect(findExactOption(OPTIONS, "  ")).toBeNull();
  });
});
