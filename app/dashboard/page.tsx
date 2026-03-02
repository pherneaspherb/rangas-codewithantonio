"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // ✅ add CardContent
import { useBoards } from "@/lib/hooks/useBoards";
import { useUser } from "@clerk/nextjs";
import { Activity, Loader2, Plus, Rocket, Trello } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { boards, loading, error, createBoard } = useBoards();

  if (!isLoaded) return <div>Loading user...</div>;
  if (!user) return <div>Please sign in to view your boards.</div>;
  if (loading)
    return (
      <div>
        <Loader2 className="animate-spin inline-block mr-2" />
        Loading your boards...
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  const handleCreateBoard = async () => {
    await createBoard({ title: "New Board" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            {user.firstName ?? user.emailAddresses[0].emailAddress}! 👋
          </h1>
          <p className="text-gray-600 mb-4">
            Here's what's happening with your boards today.
          </p>

          <Button className="w-full sm:w-auto" onClick={handleCreateBoard}>
            <Plus className="h-4 w-4 mr-2" />
            Create Board
          </Button>
        </div>

        {/* ✅ STATS (this is what the tutorial shows) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* 1st card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">

                {/* Left side */}
                <div>
                  <p className="text-sm text-gray-500">Total Boards</p>
                  <p className="text-2xl font-bold">{boards.length}</p>
                </div>

                {/* Right side (Icon centered) */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>

              </div>
            </CardContent>
          </Card>
          {/* 2nd card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">

                {/* Left side */}
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

                {/* Right side */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* 3rd card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">

                {/* Left side */}
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold">{boards.length}</p>
                </div>

                {/* Right side (Icon centered) */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>

              </div>
            </CardContent>
          </Card>
          {/* 4th card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">

                {/* Left side */}
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold">{boards.length}</p>
                </div>

                {/* Right side (Icon centered) */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ BOARD LIST (optional, you can keep this) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {boards.length === 0 ? (
            <p>No boards yet.</p>
          ) : (
            boards.map((board) => (
              <Card key={board.id}>
                <CardContent className="p-4">{board.title}</CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}