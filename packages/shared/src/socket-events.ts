/** Socket.io event names — single contract for client & server */

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Rooms & game
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE: 'room:state',       // Server → Client: full snapshot
  ROOM_ACTION: 'room:action',     // Client → Server: player action
  ROOM_CONFIRM: 'room:confirm',   // Server → Client: action accepted/rejected + snapshot

  // Matchmaking
  MATCHMAKING_JOIN: 'matchmaking:join',
  MATCHMAKING_LEAVE: 'matchmaking:leave',
  MATCHMAKING_MATCHED: 'matchmaking:matched',

  // Safety / AI
  SAFETY_VIOLATION: 'safety:violation',

  // Wallet (server → client push)
  BALANCE_UPDATED: 'balance:updated',

  // Room join result
  ROOM_JOIN_ERROR: 'room:join_error',

  // Table / dealer (שולחן, הימורים, סיום משחק)
  JOIN_TABLE: 'join_table',
  PLAYER_MOVE: 'player_move',
  TABLE_UPDATE: 'table_update',
  PLACE_BET: 'place_bet',
  BET_PLACED: 'bet_placed',
  GAME_FINISHED: 'game_finished',
  GAME_OVER: 'game_over',

  // P2P Skill-Economy (Escrow + Settlement)
  P2P_MATCH_START: 'p2p:match_start',
  P2P_MATCH_STARTED: 'p2p:match_started',
  P2P_MATCH_END: 'p2p:match_end',
  P2P_MATCH_ENDED: 'p2p:match_ended',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
