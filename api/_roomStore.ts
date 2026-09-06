import { RoomManager } from '../server/room-manager';

// Global in-memory room store singleton across invocations
const globalForRooms = globalThis as unknown as {
  roomManager?: RoomManager;
};

export const roomManager = globalForRooms.roomManager ?? new RoomManager();
globalForRooms.roomManager = roomManager;
