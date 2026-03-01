"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBoards } from "@/lib/hooks/useBoards";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { boards, loading, error, createBoard } = useBoards();

  if (!isLoaded) return <div>Loading user...</div>;

  // ✅ IMPORTANT: handle signed-out state
  if (!user) return <div>Please sign in to view your boards.</div>;

  // only load boards when user exists
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
            {user.firstName ?? user.primaryEmailAddress?.emailAddress ?? "there"}!
            👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your boards today.
          </p>

          <Button className="w-full sm:w-auto" onClick={handleCreateBoard}>
            <Plus className="h-4 w-4 mr-2" />
            Create Board
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {boards.length === 0 ? (
            <p>No boards yet.</p>
          ) : (
            boards.map((board) => <Card key={board.id}>{board.title}</Card>)
          )}
        </div>
      </main>
    </div>
  );
}