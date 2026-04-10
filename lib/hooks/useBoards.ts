"use client";

import { useUser } from "@clerk/nextjs";
import {
  boardDataService,
  boardService,
  columnService,
  taskService,
} from "../services";
import { useEffect, useState } from "react";
import { Board, Column, ColumnWithTasks, Task } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!supabase) return;
    loadBoards();
  }, [user, supabase]);

  async function loadBoards() {
    if (!user) return;
    if (!supabase) return;

    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase, user.id);
      setBoards(data);
      console.log("user:", user?.id, "supabase ready:", !!supabase);
    } catch (err: any) {
      console.error("🔥 FULL ERROR:", err);
      console.log("message:", err?.message);
      console.log("details:", err?.details);
      console.log("hint:", err?.hint);
      console.log("code:", err?.code);

      setError(err?.message || "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }

  async function createBoard(boardData: {
    title: string;
    description?: string;
    color?: string;
  }) {
    if (!user) throw new Error("User not authenticated");

    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumns(
        supabase!,
        {
          ...boardData,
          userId: user?.id,
        },
      );
      setBoards((prev) => [newBoard, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board.");
    }
  }

  return { boards, loading, error, createBoard };
}

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    if (!supabase) return;
    loadBoard();
  }, [boardId, supabase]);

  async function loadBoard() {
    if (!boardId) return;
    if (!supabase) return;

    try {
      setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase,
        boardId,
      );
      setBoard(data.board);
      setColumns(data.columnsWithTasks);
      console.log("board:", data.board?.id, "supabase ready:", !!supabase);
    } catch (err) {
      console.error("loadBoards error:", err);
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBoard(boardId: string, updates: Partial<Board>) {
    if (!boardId) return;
    if (!supabase) return;

    try {
      setLoading(true);
      setError(null);

      const updatedBoard = await boardService.updateBoard(
        supabase,
        boardId,
        updates,
      );

      setBoard(updatedBoard);
      console.log("board:", updatedBoard?.id, "supabase ready:", !!supabase);
    } catch (err) {
      console.error("updateBoard error:", err);
      setError(err instanceof Error ? err.message : "Failed to update board.");
    } finally {
      setLoading(false);
    }
  }

  async function createRealTask(
    columnId: string,
    taskData: {
      title: string;
      description?: string;
      assignee?: string;
      dueDate?: string;
      priority?: "low" | "medium" | "high";
    },
  ) {
    try {
      console.log("creating task with:", {
        title: taskData.title,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.dueDate || null,
        column_id: columnId,
        sort_order:
          columns.find((col) => col.id === columnId)?.tasks.length || 0,
        priority: taskData.priority || "medium",
      });
      const newTask = await taskService.createTask(supabase!, {
        title: taskData.title,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.dueDate || null,
        column_id: columnId,
        sort_order:
          columns.find((col) => col.id === columnId)?.tasks.length || 0,
        priority: taskData.priority || "medium",
      });

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col,
        ),
      );

      return newTask;
    } catch (err: any) {
      console.error("createRealTask raw error:", err);
      console.log("message:", err?.message);
      console.log("details:", err?.details);
      console.log("hint:", err?.hint);
      console.log("code:", err?.code);

      setError(err?.message || "Failed to create the task.");
    }
  }

  async function moveTask(
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    try {
      await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);

      setColumns((prev) => {
        const newColumns = [...prev];

        //Find and remove task from the old column
        let taskToMove: Task | null = null;
        for (const col of newColumns) {
          const taskIndex = col.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex !== -1) {
            taskToMove = col.tasks[taskIndex];
            col.tasks.splice(taskIndex, 1);
            break;
          }
        }

        if (taskToMove) {
          // Add task to new column
          const targetColumn = newColumns.find((col) => col.id === newColumnId);
          if (targetColumn) {
            targetColumn.tasks.splice(newOrder, 0, taskToMove);
          }
        }

        return newColumns;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task.");
    }
  }

  async function createColumn(title: string) {
    if (!board || !user) throw new Error("Board not loaded");

    try {
      const newColumn = await columnService.createColumn(supabase!, {
        title,
        board_id: board.id,
        sort_order: columns.length,
        user_id: user.id,
      });

      setColumns((prev) => [...prev, { ...newColumn, tasks: [] }]);
      return newColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column.");
    }
  }

  async function updateColumn(columnId: string, title: string) {
    try {
      const updatedColumn = await columnService.updateColumnTitle(
        supabase!,
        columnId,
        title,
      );

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: updatedColumn.title } : col,
        ),
      );

      return updatedColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update column.");
    }
  }

  return {
    board,
    columns,
    loading,
    error,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
    createColumn,
    updateColumn,
  };
}
