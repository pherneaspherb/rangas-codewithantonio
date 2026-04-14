"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoaded: boolean;
};

const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoaded: isSessionLoaded } = useSession();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isSessionLoaded) return;

    if (!session) {
      setSupabase(null);
      setIsLoaded(true);
      return;
    }

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          const token = await session.getToken({ template: "supabase" });
          return token ?? null;
        },
      },
    );

    setSupabase(client);
    setIsLoaded(true);
  }, [session, isSessionLoaded]);

  return (
    <Context.Provider value={{ supabase, isLoaded }}>
      {!isLoaded ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border">
              <div className="h-6 w-6 rounded-md border-4 border-gray-300 border-t-black animate-spin" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              Loading workspace
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Setting up your boards and tasks...
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  return useContext(Context);
};
