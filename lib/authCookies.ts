/** 인증 쿠키 옵션. 로그인(set-cookie)과 프록시의 access 갱신이 같은 값을 쓴다. */
export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24, // 24시간 (액세스 토큰과 맞춤)
  path: "/",
};

export const REFRESH_COOKIE_OPTIONS = {
  ...ACCESS_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 7, // 7일
};
