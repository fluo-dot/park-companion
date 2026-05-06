import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUser, type DemoUser } from "@/lib/demo-store";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? getDemoUser());
      setLoading(false);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? getDemoUser());
      })
      .catch(() => setUser(getDemoUser()))
      .finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
