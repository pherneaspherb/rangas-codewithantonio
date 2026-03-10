"use client"

import Navbar from "@/components/navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoard } from "@/lib/hooks/useBoards";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function BoardPage() {
    const { id } = useParams<{ id: string }>();
    const { board } = useBoard(id);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newColor, setNewColor] = useState("");


    return (
        <div className="min-h-screen bg-gray-50">
            {" "}
            <Navbar boardTitle={board?.title} onEditBoard={() => {
                setNewTitle(board?.title ?? "")
                setNewColor(board?.color ?? "")
                setIsEditingTitle(true);
            }}
            />

            <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
                <DialogContent className="w-[95vw] max-w-425px mx-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Board</DialogTitle>
                    </DialogHeader>
                    <form>
                        <div>
                            <Label htmlFor="boardTitle">Board Title</Label>
                            <Input
                                id="boardTitle"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Enter board title..."
                                required
                            />
                        </div>
                        <div>

                        </div>
                        <Label>Board Color</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
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
                                    onClick={() => setNewColor(color)}
                                    className={`w-8 h-8 rounded-full ${color} ${color === newColor ? "ring-2 ring-offset-2 ring-gray-900" : ""
                                        }`}
                                        onClick={() => setNewColor(color)}
                                />
                            ))}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}