import { OptionItem } from "@/types";

// 접두 일치를 부분 일치보다 앞에 배치한다 (대소문자 무시, label/value 모두 비교).
export function filterOptions(
  options: OptionItem[],
  query: string
): OptionItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;

  const prefix: OptionItem[] = [];
  const partial: OptionItem[] = [];
  for (const opt of options) {
    const label = opt.label.toLowerCase();
    const value = opt.value.toLowerCase();
    if (label.startsWith(q) || value.startsWith(q)) {
      prefix.push(opt);
    } else if (label.includes(q) || value.includes(q)) {
      partial.push(opt);
    }
  }
  return [...prefix, ...partial];
}

export function findExactOption(
  options: OptionItem[],
  query: string
): OptionItem | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    options.find(
      (opt) => opt.label.toLowerCase() === q || opt.value.toLowerCase() === q
    ) ?? null
  );
}
