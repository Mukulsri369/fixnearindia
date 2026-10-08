export function canViewAllRequests(roles: readonly string[]) {
  return roles.includes("admin");
}

export function canViewDashboardRating(isTechnician: boolean) {
  return isTechnician;
}

export function matchesRequestLocation(
  request: { state?: string | null; city?: string | null },
  state?: string | null,
  city?: string | null,
) {
  const selectedState = state?.trim();
  const selectedCity = city?.trim();
  return (!selectedState || request.state === selectedState) &&
    (!selectedCity || (request.city ?? "").toLowerCase() === selectedCity.toLowerCase());
}