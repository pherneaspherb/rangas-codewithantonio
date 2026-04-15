"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBoard, useBoards } from "@/lib/hooks/useBoards";
import { ColumnWithTasks, Task as TaskType } from "@/lib/supabase/models";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Plus,
  Sparkles,
  User,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SmartPriority = "urgent" | "medium" | "low";

type EnhancedTask = TaskType & {
  smartPriority: SmartPriority;
  priorityScore: number;
};

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysDifferenceFromToday(dateString?: string | null) {
  if (!dateString) return null;

  const today = normalizeDate(new Date());
  const due = normalizeDate(new Date(dateString));

  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusScore(columnTitle: string) {
  const title = columnTitle.toLowerCase();

  if (title.includes("done")) return 0;
  if (title.includes("progress") || title.includes("doing")) return 1;
  if (
    title.includes("to do") ||
    title.includes("todo") ||
    title.includes("backlog")
  )
    return 2;

  return 1;
}

function getDueDateScore(dueDate?: string | null) {
  const daysDiff = getDaysDifferenceFromToday(dueDate);

  if (daysDiff === null) return 0;
  if (daysDiff < 0) return 5; // overdue
  if (daysDiff === 0) return 4; // today
  if (daysDiff === 1) return 3; // tomorrow
  if (daysDiff <= 3) return 2; // soon
  return 0;
}

function getManualPriorityScore(priority?: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return 2;
    case "medium":
      return 1;
    case "low":
      return 0;
    default:
      return 0;
  }
}

function computeSmartPriority(
  task: TaskType,
  columnTitle: string,
): { smartPriority: SmartPriority; priorityScore: number } {
  const dueDateScore = getDueDateScore(task.due_date);
  const statusScore = getStatusScore(columnTitle);
  const manualPriorityScore = getManualPriorityScore(task.priority);

  const totalScore = dueDateScore + statusScore + manualPriorityScore;

  if (totalScore >= 6) {
    return { smartPriority: "urgent", priorityScore: totalScore };
  }

  if (totalScore >= 3) {
    return { smartPriority: "medium", priorityScore: totalScore };
  }

  return { smartPriority: "low", priorityScore: totalScore };
}

function getSmartPriorityBadgeClasses(priority: SmartPriority) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getSmartPriorityDot(priority: SmartPriority) {
  switch (priority) {
    case "urgent":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
}

function getSmartPriorityLabel(priority: SmartPriority) {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Low";
  }
}

function enrichColumnsWithSmartPriority(columns: ColumnWithTasks[]) {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => {
      const computed = computeSmartPriority(task, column.title);

      return {
        ...task,
        smartPriority: computed.smartPriority,
        priorityScore: computed.priorityScore,
      } as EnhancedTask;
    }),
  }));
}

function DroppableColumn({
  column,
  children,
  onCreateTask,
  onEditColumn,
  isDraggingTask,
}: {
  column: ColumnWithTasks;
  children: React.ReactNode;
  onCreateTask: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onEditColumn: (column: ColumnWithTasks) => void;
  isDraggingTask: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);

  return (
    <div ref={setNodeRef} className="w-full lg:shrink-0 lg:w-80">
      <div
        className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
          isDraggingTask && isOver
            ? "border-blue-500 ring-4 ring-blue-100 bg-blue-50/30"
            : "border-gray-200"
        }`}
      >
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {column.tasks.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => onEditColumn(column)}
            >
              <MoreHorizontal />
            </Button>
          </div>
        </div>

        <div className="p-2">
          {children}

          <Dialog
            open={isCreateTaskDialogOpen}
            onOpenChange={setIsCreateTaskDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full mt-3 text-gray-600 hover:text-gray-900"
              >
                <Plus />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <p className="text-sm text-gray-600">Add a task to the board</p>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  await onCreateTask(e);
                  setIsCreateTaskDialogOpen(false);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    name="assignee"
                    placeholder="Who should do this?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high"].map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input type="date" id="dueDate" name="dueDate" />
                </div>

                <div>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  onDelete,
}: {
  task: EnhancedTask;
  onDelete: (taskId: string, taskTitle: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysDiff = getDaysDifferenceFromToday(task.due_date);
  const isOverdue = daysDiff !== null && daysDiff < 0;

  return (
    <div ref={setNodeRef} style={styles} {...listeners} {...attributes}>
      <Card className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-snug">
                  {task.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={`border ${getSmartPriorityBadgeClasses(task.smartPriority)}`}
                >
                  {getSmartPriorityLabel(task.smartPriority)}
                </Badge>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id, task.title);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500 line-clamp-2">
              {task.description || "No description."}
            </p>

            {isOverdue && (
              <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Overdue task
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {task.assignee || "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center gap-1 min-w-0">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
              </div>

              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${getSmartPriorityDot(task.smartPriority)}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskOverlayfunction({ task }: { task: EnhancedTask }) {
  const daysDiff = getDaysDifferenceFromToday(task.due_date);
  const isOverdue = daysDiff !== null && daysDiff < 0;

  return (
    <Card className="rounded-2xl border border-gray-200 shadow-sm cursor-pointer">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-snug flex-1">
              {task.title}
            </h4>

            <Badge
              className={`border ${getSmartPriorityBadgeClasses(task.smartPriority)}`}
            >
              {getSmartPriorityLabel(task.smartPriority)}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2">
            {task.description || "No description."}
          </p>

          {isOverdue && (
            <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue task
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {task.assignee || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center gap-1 min-w-0">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : "No date"}
                </span>
              </div>
            </div>

            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${getSmartPriorityDot(task.smartPriority)}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { deleteBoard } = useBoards();
  const router = useRouter();
  const {
    board,
    createColumn,
    updateBoard,
    columns,
    createRealTask,
    setColumns,
    moveTask,
    updateColumn,
    deleteColumn,
    deleteTask,
  } = useBoard(id);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(
    null,
  );

  const [activeTask, setActiveTask] = useState<EnhancedTask | null>(null);

  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    dueDate: null as string | null,
    smartPriority: [] as SmartPriority[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const columnsWithSmartPriority = useMemo(() => {
    return enrichColumnsWithSmartPriority(columns);
  }, [columns]);

  function handleFilterChange(
    type: "priority" | "assignee" | "dueDate" | "smartPriority",
    value: string | string[] | SmartPriority[] | null,
  ) {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      priority: [],
      assignee: [],
      dueDate: null,
      smartPriority: [],
    });
  }

  async function handleUpdateBoard(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim() || !board) return;

    try {
      await updateBoard(board.id, {
        title: newTitle.trim(),
        color: newColor || board.color,
      });
      setIsEditingTitle(false);
    } catch {}
  }

  async function handleDeleteBoard() {
    if (!board) return;

    const confirmed = window.confirm(
      `Delete "${board.title}" board? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteBoard(board.id);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const taskData = {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        assignee: (formData.get("assignee") as string) || undefined,
        dueDate: (formData.get("dueDate") as string) || undefined,
        priority:
          (formData.get("priority") as "low" | "medium" | "high") || "medium",
      };

      const todoColumn = columns.find(
        (column) => column.title.toLowerCase() === "to do",
      );

      if (!todoColumn) {
        console.error("No To Do column found");
        return;
      }

      if (!taskData.title.trim()) return;

      await createRealTask(todoColumn.id, taskData);

      form.reset();
      setIsCreateTaskOpen(false);
    } catch (err) {
      console.error("handleCreateTask error:", err);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    const task = columnsWithSmartPriority
      .flatMap((col) => col.tasks)
      .find((task) => task.id === taskId);

    if (task) {
      setActiveTask(task as EnhancedTask);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    setColumns((prev) => {
      const sourceColumn = prev.find((col) =>
        col.tasks.some((task) => task.id === activeId),
      );

      if (!sourceColumn) return prev;

      const activeTask = sourceColumn.tasks.find(
        (task) => task.id === activeId,
      );
      if (!activeTask) return prev;

      const targetColumnDirect = prev.find((col) => col.id === overId);

      const targetColumnFromTask = prev.find((col) =>
        col.tasks.some((task) => task.id === overId),
      );

      const targetColumn = targetColumnDirect || targetColumnFromTask;
      if (!targetColumn) return prev;

      const sourceColumnIndex = prev.findIndex(
        (col) => col.id === sourceColumn.id,
      );
      const targetColumnIndex = prev.findIndex(
        (col) => col.id === targetColumn.id,
      );

      const activeIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === activeId,
      );

      let overIndex = targetColumn.tasks.findIndex(
        (task) => task.id === overId,
      );

      if (targetColumnDirect) {
        overIndex = targetColumn.tasks.length;
      }

      if (sourceColumn.id === targetColumn.id) {
        if (
          activeIndex === overIndex ||
          activeIndex === -1 ||
          overIndex === -1
        ) {
          return prev;
        }

        const newColumns = [...prev];
        const column = { ...newColumns[sourceColumnIndex] };
        const tasks = [...column.tasks];

        const [movedTask] = tasks.splice(activeIndex, 1);
        tasks.splice(overIndex, 0, movedTask);

        column.tasks = tasks;
        newColumns[sourceColumnIndex] = column;

        return newColumns;
      }

      const newColumns = [...prev];

      const newSourceColumn = { ...newColumns[sourceColumnIndex] };
      const newTargetColumn = { ...newColumns[targetColumnIndex] };

      const sourceTasks = [...newSourceColumn.tasks];
      const targetTasks = [...newTargetColumn.tasks];

      const [movedTask] = sourceTasks.splice(activeIndex, 1);
      if (!movedTask) return prev;

      targetTasks.splice(overIndex, 0, movedTask);

      newSourceColumn.tasks = sourceTasks;
      newTargetColumn.tasks = targetTasks;

      newColumns[sourceColumnIndex] = newSourceColumn;
      newColumns[targetColumnIndex] = newTargetColumn;

      return newColumns;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );

      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
      }
    } else {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );

      const targetColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === overId),
      );

      if (sourceColumn && targetColumn) {
        const oldIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === taskId,
        );

        const newIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId,
        );

        if (oldIndex !== newIndex) {
          await moveTask(taskId, targetColumn.id, newIndex);
        }
      }
    }
  }

  async function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();

    if (!newColumnTitle.trim()) return;

    await createColumn(newColumnTitle.trim());

    setNewColumnTitle("");
    setIsCreatingColumn(false);
  }

  async function handleUpdateColumn(e: React.FormEvent) {
    e.preventDefault();

    if (!editingColumnTitle.trim() || !editingColumn) return;

    await updateColumn(editingColumn.id, editingColumnTitle.trim());

    setEditingColumnTitle("");
    setIsEditingColumn(false);
    setEditingColumn(null);
  }

  async function handleDeleteColumn() {
    if (!editingColumn) return;

    const confirmed = window.confirm(`Delete "${editingColumn.title}" column?`);

    if (!confirmed) return;

    try {
      await deleteColumn(editingColumn.id);
      setIsEditingColumn(false);
      setEditingColumnTitle("");
      setEditingColumn(null);
    } catch (err) {
      console.error("Failed to delete column:", err);
    }
  }

  async function handleDeleteTask(taskId: string, taskTitle: string) {
    const confirmed = window.confirm(`Delete "${taskTitle}" task?`);

    if (!confirmed) return;

    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  function handleEditColumn(column: ColumnWithTasks) {
    setIsEditingColumn(true);
    setEditingColumn(column);
    setEditingColumnTitle(column.title);
  }

  const filteredColumns = columnsWithSmartPriority.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }

      if (
        filters.assignee.length > 0 &&
        !filters.assignee.includes(task.assignee || "")
      ) {
        return false;
      }

      if (
        filters.smartPriority.length > 0 &&
        !filters.smartPriority.includes(task.smartPriority)
      ) {
        return false;
      }

      if (filters.dueDate) {
        if (!task.due_date) return false;

        const taskDate = new Date(task.due_date).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();

        if (taskDate !== filterDate) {
          return false;
        }
      }

      return true;
    }),
  }));

  const allEnhancedTasks = columnsWithSmartPriority.flatMap(
    (column) => column.tasks,
  );

  const suggestedTasks = [...allEnhancedTasks]
    .filter((task) => task.smartPriority !== "low")
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  const urgentCount = allEnhancedTasks.filter(
    (task) => task.smartPriority === "urgent",
  ).length;

  const mediumCount = allEnhancedTasks.filter(
    (task) => task.smartPriority === "medium",
  ).length;

  const lowCount = allEnhancedTasks.filter(
    (task) => task.smartPriority === "low",
  ).length;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          boardTitle={board?.title}
          onEditBoard={() => {
            setNewTitle(board?.title ?? "");
            setNewColor(board?.color ?? "");
            setIsEditingTitle(true);
          }}
          onFilterClick={() => setIsFilterOpen(true)}
          filterCount={Object.values(filters).reduce(
            (count, v) =>
              count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0),
            0,
          )}
        />

        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateBoard}>
              <div className="space-y-2">
                <Label htmlFor="boardTitle">Board Title</Label>
                <Input
                  id="boardTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter board title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Board Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                    "bg-gray-500",
                    "bg-orange-500",
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-emerald-500",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color} ${
                        color === newColor
                          ? "ring-2 ring-offset-2 ring-gray-900"
                          : ""
                      }`}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteBoard}
                >
                  Delete Board
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter tasks by priority, smart priority, assignee, or due date
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Manual Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high"].map((priority) => (
                    <Button
                      key={priority}
                      onClick={() => {
                        const newPriorities = filters.priority.includes(
                          priority,
                        )
                          ? filters.priority.filter((p) => p !== priority)
                          : [...filters.priority, priority];

                        handleFilterChange("priority", newPriorities);
                      }}
                      variant={
                        filters.priority.includes(priority)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Smart Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {(["urgent", "medium", "low"] as SmartPriority[]).map(
                    (priority) => (
                      <Button
                        key={priority}
                        onClick={() => {
                          const next = filters.smartPriority.includes(priority)
                            ? filters.smartPriority.filter(
                                (p) => p !== priority,
                              )
                            : [...filters.smartPriority, priority];

                          handleFilterChange("smartPriority", next);
                        }}
                        variant={
                          filters.smartPriority.includes(priority)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                      >
                        {getSmartPriorityLabel(priority)}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || null)
                  }
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button type="button" onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {allEnhancedTasks.length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Urgent</p>
                <p className="mt-1 text-2xl font-semibold text-red-700">
                  {urgentCount}
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">Medium</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-700">
                  {mediumCount}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Low</p>
                <p className="mt-1 text-2xl font-semibold text-green-700">
                  {lowCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {suggestedTasks.length > 0 && (
            <Card className="mb-6 border-blue-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Suggested Tasks for Today
                  </h2>
                </div>

                <div className="grid gap-3">
                  {suggestedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{task.assignee || "Unassigned"}</span>
                          <span>
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No due date"}
                          </span>
                          <span>Score: {task.priorityScore}</span>
                        </div>
                      </div>

                      <Badge
                        className={`w-fit border ${getSmartPriorityBadgeClasses(task.smartPriority)}`}
                      >
                        {getSmartPriorityLabel(task.smartPriority)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Visible tasks:</span>{" "}
                {filteredColumns.reduce(
                  (sum, col) => sum + col.tasks.length,
                  0,
                )}
              </div>
            </div>

            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus />
                  Add Task
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <p className="text-sm text-gray-600">
                    Add a task to the board
                  </p>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleCreateTask}>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input
                      id="assignee"
                      name="assignee"
                      placeholder="Who should do this?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select name="priority">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high"].map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" id="dueDate" name="dueDate" />
                  </div>

                  <div>
                    <Button type="submit">Create Task</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={(args) => {
              const pointerCollisions = pointerWithin(args);
              return pointerCollisions.length > 0
                ? pointerCollisions
                : closestCenter(args);
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto
              lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2
              lg:[&::-webkit-scrollbar-track]:bg-gray-100
              lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full
              space-y-4 lg:space-y-0"
            >
              {filteredColumns.map((filteredColumn) => (
                <DroppableColumn
                  key={filteredColumn.id}
                  column={filteredColumn}
                  onCreateTask={handleCreateTask}
                  onEditColumn={handleEditColumn}
                  isDraggingTask={!!activeTask}
                >
                  <SortableContext
                    items={filteredColumn.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {filteredColumn.tasks.map((task) => (
                        <SortableTaskCard
                          task={task as EnhancedTask}
                          key={task.id}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              ))}

              <div className="w-full lg:shrink-0 lg:w-80">
                <Button
                  variant="outline"
                  className="w-full h-full min-h-[200px] border-dashed border-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsCreatingColumn(true)}
                >
                  <Plus />
                  Add another list
                </Button>
              </div>

              <DragOverlay>
                {activeTask ? <TaskOverlayfunction task={activeTask} /> : null}
              </DragOverlay>
            </div>
          </DndContext>
        </main>
      </div>

      <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Add new column to organize your tasks
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Enter column title..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setIsCreatingColumn(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button>Create Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the title of your column
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={editingColumnTitle}
                onChange={(e) => setEditingColumnTitle(e.target.value)}
                placeholder="Enter column title..."
                required
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteColumn}
              >
                Delete Column
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditingColumn(false);
                    setEditingColumnTitle("");
                    setEditingColumn(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
