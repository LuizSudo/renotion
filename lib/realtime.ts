"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type EventHandler = (data: unknown) => void;

export function useRealtime() {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const connectRef = useRef<() => void>(() => {});
  const isConnectingRef = useRef(false);

  // Define connect function separately and store in ref
  const connect = useCallback(() => {
    if (!session?.user?.id) return;
    if (eventSourceRef.current || isConnectingRef.current) return;

    isConnectingRef.current = true;
    const es = new EventSource("/api/realtime");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      isConnectingRef.current = false;
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;
      isConnectingRef.current = false;

      // Exponential backoff reconnect
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current?.();
      }, delay);
    };

    // Listen for all events
    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = handlersRef.current.get(event.type) || handlersRef.current.get("*");
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      } catch {
        // Ignore parse errors
      }
    });

    // Listen for specific event types
    ["note_updated", "reminder_updated", "event_updated", "connected", "ping"].forEach((eventType) => {
      es.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          const handlers = handlersRef.current.get(eventType);
          if (handlers) {
            handlers.forEach((handler) => handler(data));
          }
        } catch {
          // Ignore parse errors
        }
      });
    });
  }, [session?.user?.id]);

  // Store connect in ref for use in setTimeout
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const on = useCallback((eventType: string, handler: EventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    return () => {
      handlersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  const off = useCallback((eventType: string, handler: EventHandler) => {
    handlersRef.current.get(eventType)?.delete(handler);
  }, []);

  // Track connection state with a ref to avoid setState in effect
  const shouldConnectRef = useRef(false);

  useEffect(() => {
    shouldConnectRef.current = Boolean(session?.user?.id);
    
    if (shouldConnectRef.current) {
      connect();
    } else {
      // Use setTimeout to avoid setState in render phase
      setTimeout(() => disconnect(), 0);
    }

    return () => {
      setTimeout(() => disconnect(), 0);
    };
  }, [session?.user?.id, connect, disconnect]);

  return {
    isConnected,
    on,
    off,
    connect,
    disconnect,
  };
}

// Specific hooks for different entity types
export function useNoteUpdates(noteId: string | null) {
  const { on, off } = useRealtime();
  const [lastUpdate, setLastUpdate] = useState<{ content: string; updatedAt: string } | null>(null);

  useEffect(() => {
    if (!noteId) return;

    const unsubscribe = on(
      "note_updated",
      (data: unknown) => {
        const typedData = data as { noteId: string; content: string; updatedAt: string };
        if (typedData.noteId === noteId) {
          setLastUpdate({ content: typedData.content, updatedAt: typedData.updatedAt });
        }
      }
    );

    return unsubscribe;
  }, [noteId, on, off]);

  return lastUpdate;
}

export function useReminderUpdates(reminderId: string | null) {
  const { on, off } = useRealtime();
  const [lastUpdate, setLastUpdate] = useState<{ done: boolean; updatedAt: string } | null>(null);

  useEffect(() => {
    if (!reminderId) return;

    const unsubscribe = on(
      "reminder_updated",
      (data: unknown) => {
        const typedData = data as { reminderId: string; done: boolean; updatedAt: string };
        if (typedData.reminderId === reminderId) {
          setLastUpdate({ done: typedData.done, updatedAt: typedData.updatedAt });
        }
      }
    );

    return unsubscribe;
  }, [reminderId, on, off]);

  return lastUpdate;
}