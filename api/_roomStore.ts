import { RoomManager } from '../server/room-manager';

// Global in-memory singleton for serverless state across invocations in same instance
const globalForRooms = globalThis as unknown as {
  roomManager?: RoomManager;
};

export const roomManager = globalForRooms.roomManager ?? new RoomManager();
if (process.env.NODE_ENV !== 'production') {
  globalForRooms.roomManager = roomManager;
} else {
  globalForRooms.roomManager = roomManager;
}
