import { useQuery } from "@tanstack/react-query";
import { listCategories } from "../services/categories.js";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 1000 * 60 * 30,
  });
}
