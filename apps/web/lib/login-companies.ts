export const loginCompanies = [
  {
    key: "acre-ny-realty",
    name: "Acre NY Realty"
  },
  {
    key: "acre-nj",
    name: "Acre NJ"
  },
  {
    key: "acre-rental",
    name: "Acre Rental"
  }
] as const;

export type LoginCompanyKey = (typeof loginCompanies)[number]["key"];

export function parseLoginCompanyKey(value: string | undefined): LoginCompanyKey | null {
  if (!value) {
    return null;
  }

  return loginCompanies.find((company) => company.key === value)?.key ?? null;
}

export function getLoginCompanyLabel(value: LoginCompanyKey | null) {
  return loginCompanies.find((company) => company.key === value)?.name ?? null;
}
