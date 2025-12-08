import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) return null;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (error) {
          console.error("User profile fetch failed", error);
          // Return the auth user as a fallback
          return authUser;
        }

        return profile || authUser;
      } catch (error) {
        console.error("An error occurred during profile fetch", error);
        return authUser;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
