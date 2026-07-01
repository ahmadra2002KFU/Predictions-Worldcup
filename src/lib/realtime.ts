import { EventEmitter } from "node:events";
import type { LeaderboardStanding } from "./leaderboard";

export interface ChatMessageDTO {
  id: string;
  matchId: string;
  participantId: string;
  displayName: string;
  body: string;
  createdAt: string;
}

export type RealtimeEvent =
  | { channel: "chat"; matchId: string; message: ChatMessageDTO }
  | { channel: "leaderboard"; standings: LeaderboardStanding[] };

declare global {
  var __mufeedBus: EventEmitter | undefined;
}

const bus = globalThis.__mufeedBus ?? new EventEmitter();
bus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") {
  globalThis.__mufeedBus = bus;
}

export function publish(event: RealtimeEvent) {
  bus.emit("event", event);
}

export function subscribe(onEvent: (event: RealtimeEvent) => void) {
  bus.on("event", onEvent);
  return () => bus.off("event", onEvent);
}
