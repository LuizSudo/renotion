import { getServerSession } from "@/lib/auth";
import { NextRequest } from "next/server";

// In-memory store for SSE connections (in production, use Redis or similar)
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
}

export function removeConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.get(userId)?.delete(controller);
}

export function broadcastToUser(userId: string, event: string, data: unknown) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  userConnections.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch {
      // Connection closed, remove it
      userConnections.delete(controller);
    }
  });
}

export function broadcastToAll(event: string, data: unknown) {
  connections.forEach((userConnections) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    userConnections.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch {
        userConnections.delete(controller);
      }
    });
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const stream = new ReadableStream({
    start(controller) {
      addConnection(userId, controller);
      
      // Send initial connection event
      controller.enqueue(new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`));
      
      // Keep alive ping every 30 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        removeConnection(userId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}