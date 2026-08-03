export const ROUTES = {
  home: "/",

  login: "/login",
  register: "/register",

  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  freightOwner: "/freight-owner",
  freightOwnerLoads: "/freight-owner/loads",
  freightOwnerNewLoad: "/freight-owner/loads/new",
  freightOwnerMatches: "/freight-owner/matches",
  freightOwnerReceipts: "/freight-owner/receipts",
  freightOwnerTracking: "/freight-owner/tracking",

  transporter: "/transporter",
  admin: "/admin",
} as const;
