"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";

type BoardBreakdownItem = {
  name: string;
  tasks: number;
};

type DashboardAnalytics = {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completionRate: number;
  mostActiveBoard: string | null;
  boardBreakdown: BoardBreakdownItem[];
};

export function useDashboardAnalytics() {
  const { supabase } = useSupabase();

  const [data, setData] = useState<DashboardAnalytics>({
    totalTasks: 0,
    completedTasks: 0,
    activeTasks: 0,
    completionRate: 0,
    mostActiveBoard: null,
    boardBreakdown: [],
  });

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*");

      const { data: columns, error: columnsError } = await supabase
        .from("columns")
        .select("*");

      const { data: boards, error: boardsError } = await supabase
        .from("boards")
        .select("id, title");

      if (tasksError || columnsError || boardsError) {
        console.error("Analytics fetch error:", {
          tasksError,
          columnsError,
          boardsError,
        });
        return;
      }

      if (!tasks || !columns || !boards) return;

      const doneKeywords = ["done", "complete", "completed", "finished"];

      const doneColumnIds = columns
        .filter((col) =>
          doneKeywords.some((word) =>
            String(col.title).toLowerCase().includes(word),
          ),
        )
        .map((col) => col.id);

      const completed = tasks.filter((t) => doneColumnIds.includes(t.column_id));
      const active = tasks.filter((t) => !doneColumnIds.includes(t.column_id));

      const completionRate =
        tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

      const boardCount: Record<string, number> = {};

      tasks.forEach((t) => {
        boardCount[t.board_id] = (boardCount[t.board_id] || 0) + 1;
      });

      const mostActiveBoardId =
        Object.entries(boardCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const mostActiveBoardTitle =
        boards.find((board) => board.id === mostActiveBoardId)?.title || null;

      const boardBreakdown = boards.map((board) => ({
        name: board.title,
        tasks: boardCount[board.id] || 0,
      }));

      setData({
        totalTasks: tasks.length,
        completedTasks: completed.length,
        activeTasks: active.length,
        completionRate,
        mostActiveBoard: mostActiveBoardTitle,
        boardBreakdown,
      });
    }

    fetchData();
  }, [supabase]);

  return data;
}