/** Maps userId -> Set of socket ids for server push (e.g. balance:updated) */
const userSocketIds = new Map<string, Set<string>>();

export function registerUserSocket(userId: string, socketId: string) {
  let set = userSocketIds.get(userId);
  if (!set) {
    set = new Set();
    userSocketIds.set(userId, set);
  }
  set.add(socketId);
}

export function unregisterUserSocket(userId: string, socketId: string) {
  const set = userSocketIds.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userSocketIds.delete(userId);
  }
}

export function getSocketIdsForUser(userId: string): string[] {
  return Array.from(userSocketIds.get(userId) ?? []);
}
