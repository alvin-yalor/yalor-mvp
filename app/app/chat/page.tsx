"use client";

import { useState } from "react";

export default function ChatPage() {
  const [userInput, setUserInput] = useState("");
  const [agentReply, setAgentReply] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // For now: no API call, just fake reply
    setAgentReply("Hello World 👋 I am your mock ACE agent.");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10">
      <h1 className="text-3xl font-bold mb-4">Mock ACE Agent (v0)</h1>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 w-full max-w-md"
      >
        <input
          type="text"
          className="border rounded p-2 flex-1"
          placeholder="Say something..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>
      </form>

      {agentReply && (
        <div className="mt-6 p-4 border rounded max-w-md w-full bg-gray-50">
          <strong>Agent:</strong> {agentReply}
        </div>
      )}
    </div>
  );
}
