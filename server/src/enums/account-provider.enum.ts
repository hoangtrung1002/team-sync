export const ProviderEnum = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  GITHUB: "GITHUB",
  EMAIL: "EMAIL",
} as const;
export type ProviderEnumType = keyof typeof ProviderEnum;
