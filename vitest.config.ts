import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // 순수 로직만 테스트하므로 DOM 환경이 필요 없다.
    environment: "node",
    // 날짜 로직이 로컬 타임존에 의존하므로 실행 환경에 상관없이 KST로 고정한다.
    env: { TZ: "Asia/Seoul" },
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
