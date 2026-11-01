import { useQuery } from "@tanstack/react-query";

export interface AuthConfig {
  socialProviders: string[];
  allowedEmailDomains: string[];
}

export function useAuthConfig() {
  return useQuery<AuthConfig>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Could not load sign-in options");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
