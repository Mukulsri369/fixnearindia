import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth.jsx";
import { getMyProfile } from "../services/profiles.js";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getMyProfile(user.id),
    enabled: !!user?.id,
  });
}
