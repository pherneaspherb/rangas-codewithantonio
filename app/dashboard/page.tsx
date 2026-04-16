"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // ✅ add CardContent
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlan } from "@/lib/contexts/PlanContext";
import { useBoards } from "@/lib/hooks/useBoards";
import { useDashboardAnalytics } from "@/lib/hooks/useDashboardAnalytics";
import { Board } from "@/lib/supabase/models";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  Filter,
  Grid3x3,
  List,
  Loader2,
  Plus,
  Rocket,
  Search,
  Trash2,
  Trello,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { boards, loading, error, createBoard, deleteBoard } = useBoards();
  const analytics = useDashboardAnalytics();
  const router = useRouter();
  const { isFreeUser } = usePlan();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState<boolean>(false);

  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    dateRange: {
      start: null as string | null,
      end: null as string | null,
    },
    taskCount: {
      min: null as number | null,
      max: null as number | null,
    },
  });

  const canCreateBoard = !isFreeUser || boards.length < 1;

  const boardsWithTaskCount = boards.map((board: Board) => ({
    ...board,
    taskCount: 0,
  }));

  const filteredBoards = boardsWithTaskCount.filter((board: Board) => {
    const matchesSearch = board.title
      .toLowerCase()
      .includes(filters.search.toLowerCase());

    const matchesDateRange =
      (!filters.dateRange.start ||
        new Date(board.created_at) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end ||
        new Date(board.created_at) <= new Date(filters.dateRange.end));

    return matchesSearch && matchesDateRange;
  });

  const taskStatusData = [
    { name: "Active", value: analytics.activeTasks ?? 0 },
    { name: "Completed", value: analytics.completedTasks ?? 0 },
  ];

  const COLORS = ["#22c55e", "#3b82f6"]; // Active, Completed

  const boardTaskData = analytics.boardBreakdown ?? [];

  function clearFilters() {
    setFilters({
      search: "",
      dateRange: {
        start: null as string | null,
        end: null as string | null,
      },
      taskCount: {
        min: null as number | null,
        max: null as number | null,
      },
    });
  }

  if (!isLoaded) return <div>Loading user...</div>;
  if (!user) return <div>Please sign in to view your boards.</div>;
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="container mx-auto px-4 py-6 sm:py-8 animate-pulse">
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-72 rounded-md bg-gray-200 mb-3" />
            <div className="h-4 w-56 rounded-md bg-gray-200" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                      <div className="h-8 w-12 rounded bg-gray-200" />
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Header skeleton */}
          <div className="mt-8 sm:mt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="h-7 w-40 rounded bg-gray-200" />
                <div className="h-4 w-52 rounded bg-gray-200" />
                <div className="h-4 w-36 rounded bg-gray-200" />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-10 w-24 rounded-lg bg-gray-200" />
                <div className="h-10 w-20 rounded-lg bg-gray-200" />
                <div className="h-10 w-32 rounded-lg bg-gray-200" />
              </div>
            </div>

            {/* Search skeleton */}
            <div className="mt-4 h-10 w-full rounded-lg bg-gray-200" />

            {/* Boards skeleton */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-4 rounded bg-gray-200" />
                      <div className="h-5 w-10 rounded-full bg-gray-200" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-5 w-32 rounded bg-gray-200 mb-3" />
                    <div className="h-4 w-full rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-3/4 rounded bg-gray-200 mb-4" />
                    <div className="flex justify-between gap-3">
                      <div className="h-3 w-20 rounded bg-gray-200" />
                      <div className="h-3 w-20 rounded bg-gray-200" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading your boards...
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (error) return <div>Error: {error}</div>;

  const handleCreateBoard = () => {
    if (!canCreateBoard) {
      setShowUpgradeDialog(true);
      return;
    }

    setBoardTitle("");
    setShowCreateBoardDialog(true);
  };

  const handleSubmitCreateBoard = async () => {
    const trimmedTitle = boardTitle.trim();

    if (!trimmedTitle) return;

    try {
      setIsCreatingBoard(true);
      await createBoard({ title: trimmedTitle });
      setShowCreateBoardDialog(false);
      setBoardTitle("");
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this board?",
    );

    if (!confirmed) return;

    try {
      setDeletingBoardId(boardId);
      await deleteBoard(boardId);
    } catch (err) {
      console.error("Failed to delete board:", err);
    } finally {
      setDeletingBoardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || user.username || "there"}! 👋
          </h1>
          <p className="text-gray-600 mb-4">
            Here's what's happening with your boards today.
          </p>
        </div>
        {/* ✅ STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Completion Rate */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {analytics?.completionRate ?? 0}%
                  </p>
                </div>

                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Boards */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Boards</p>
                  <p className="text-2xl font-bold">{boards.length}</p>
                </div>

                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recent Activity</p>
                  <p className="text-2xl font-bold">
                    {
                      boards.filter((board) => {
                        const updatedAt = new Date(board.updated_at);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return updatedAt > oneWeekAgo;
                      }).length
                    }
                  </p>
                </div>

                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Tasks */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-bold">{analytics.totalTasks}</p>
                  <p className="text-sm text-gray-500 mt-2">Completed</p>
                  <p className="text-xl font-bold">
                    {analytics.completedTasks}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Active Tasks</p>
                  <p className="text-xl font-bold">{analytics.activeTasks}</p>
                </div>

                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* ✅ ANALYTICS OVERVIEW */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Analytics Overview
            </h2>
            <p className="text-gray-600">
              Track productivity, task progress, and board activity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active vs Completed Tasks</CardTitle>
                <CardDescription>
                  Overview of current workload and finished tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    const COLORS = ["#22c55e", "#3b82f6"]; // Active, Completed
                    <Pie
                      data={taskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>
        {/* Boards */}
        <div className="mt-8 sm:mt-12">
          {/* Header row: left text + right controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: title + description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Your Boards
              </h2>
              <p className="text-gray-600">Manage your projects and tasks</p>

              <p className="text-sm text-gray-500 mt-1">
                {isFreeUser ? (
                  <span>
                    {boards.length}/1 boards used •{" "}
                    <button
                      onClick={() => router.push("/pricing")}
                      className="text-blue-600 hover:underline"
                    >
                      Upgrade
                    </button>
                  </span>
                ) : (
                  `${boards.length} boards used • Unlimited`
                )}
              </p>
            </div>

            {/* Right: controls (match screenshot) */}
            <div className="flex items-center gap-2">
              {/* Toggle group container */}
              <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={
                    viewMode === "grid" ? "bg-black hover:bg-gray-800" : ""
                  }
                >
                  <Grid3x3
                    className={viewMode === "grid" ? "text-white" : ""}
                  />
                </Button>

                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list" ? "bg-black hover:bg-gray-800" : ""
                  }
                >
                  <List className={viewMode === "list" ? "text-white" : ""} />
                </Button>
              </div>

              {/* Filter button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>

              {/* Create board button */}
              <Button onClick={handleCreateBoard}>
                <Plus className="h-4 w-4" />
                Create Board
              </Button>
            </div>
          </div>

          {/* Search bar row (below) */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <Input
                id="search"
                placeholder="Search boards..."
                className="pl-10"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
            {/*Boards Grid List*/}
            {filteredBoards.length === 0 ? (
              <div className="mt-6">No boards yet</div>
            ) : viewMode === "grid" ? (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredBoards.map((board, key) => (
                  <Link href={`/boards/${board.id}`} key={key}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 ${board.color} rounded shrink-0`}
                            />
                            <Badge className="text-xs" variant="secondary">
                              New
                            </Badge>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteBoard(board.id);
                            }}
                            disabled={deletingBoardId === board.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
                          {board.title}
                        </CardTitle>
                        <CardDescription className="text-sm mb-4">
                          {board.description}
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                          <span>
                            Created{" "}
                            {new Date(board.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(board.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                <Card
                  onClick={handleCreateBoard}
                  className="mt-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                    <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                      Create new board
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>
                {filteredBoards.map((board, key) => (
                  <div key={key} className={key > 0 ? "mt-4" : ""}>
                    <Link href={`/boards/${board.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-4 h-4 ${board.color} rounded shrink-0`}
                              />
                              <Badge className="text-xs" variant="secondary">
                                New
                              </Badge>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteBoard(board.id);
                              }}
                              disabled={deletingBoardId === board.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
                            {board.title}
                          </CardTitle>
                          <CardDescription className="text-sm mb-4">
                            {board.description}
                          </CardDescription>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                            <span>
                              Created{" "}
                              {new Date(board.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              Updated{" "}
                              {new Date(board.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}

                <Card
                  onClick={handleCreateBoard}
                  className="mt-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-50[200px]">
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                    <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                      Create new board
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/*Filter Dialog*/}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="w-[95vw] max-w-425px mx-auto">
          <DialogHeader>
            <DialogTitle>Filter Boards</DialogTitle>
            <p className="text-sm text-gray-600">
              Filter boards by title, date, or task count.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                id="search"
                placeholder="Search board titles..."
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Range</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">End Range</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Task Count</Label>
              <div>
                <div>
                  <Label className="text-xs">Minimum</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min tasks"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        taskCount: {
                          ...prev.taskCount,
                          min: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Maximum</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max tasks"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        taskCount: {
                          ...prev.taskCount,
                          max: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-4 space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateBoardDialog}
        onOpenChange={setShowCreateBoardDialog}
      >
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <p className="text-sm text-gray-600">
              Enter a name for your new board.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardTitle">Board Name</Label>
              <Input
                id="boardTitle"
                placeholder="e.g. Marketing Plan"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && boardTitle.trim()) {
                    handleSubmitCreateBoard();
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateBoardDialog(false);
                  setBoardTitle("");
                }}
                disabled={isCreatingBoard}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitCreateBoard}
                disabled={!boardTitle.trim() || isCreatingBoard}
              >
                {isCreatingBoard ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="w-[95vw] max-w-425px mx-auto">
          <DialogHeader>
            <DialogTitle>Upgrade to Create More Boards</DialogTitle>
            <p className="text-sm text-gray-600">
              Free users can only create one board. Upgrade to Pro or Enterprise
              to create unlimited boards.
            </p>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => router.push("/pricing")}>View Plans</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
