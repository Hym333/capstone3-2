// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ListOnlineUsers from "@/components/ListOnlineUsers";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const joinMeeting = () => {
    if (roomId) {
      router.push(`/meeting/${roomId}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl text-black font-bold mb-8 text-center">
        Video Conference App
      </h1>
      <div className="w-full max-w-md">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room ID"
          className="w-full px-4 py-2 text-black rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={joinMeeting}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Join Meeting
        </button>
        <ListOnlineUsers/>
      </div>
    </main>
  );
}
