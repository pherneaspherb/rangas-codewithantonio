"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";

export function useDashboardAnalytics() {
  const { supabase } = useSupabase();

  const [data, setData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeTasks: 0,
    mostActiveBoard: null as string | null,
  });

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;

      // get all tasks
      const { data: tasks } = await supabase.from("tasks").select("*");

      // get all columns
      const { data: columns } = await supabase.from("columns").select("*");

      if (!tasks || !columns) return;

      // find DONE columns
      const doneColumnIds = columns
        .filter((col) => col.title.toLowerCase().includes("done"))
        .map((col) => col.id);

      const completed = tasks.filter((t) =>
        doneColumnIds.includes(t.column_id)
      );

      const active = tasks.filter(
        (t) => !doneColumnIds.includes(t.column_id)
      );

      // most active board
      const boardCount: Record<string, number> = {};

      tasks.forEach((t) => {
        boardCount[t.board_id] = (boardCount[t.board_id] || 0) + 1;
      });

      const mostActiveBoardId = Object.entries(boardCount).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];

      setData({
        totalTasks: tasks.length,
        completedTasks: completed.length,
        activeTasks: active.length,
        mostActiveBoard: mostActiveBoardId || null,
      });
    }

    fetchData();
  }, [supabase]);

  return data;
}