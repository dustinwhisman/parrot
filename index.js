import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080, host: '0.0.0.0' });
console.log('websocket server set up on port 8080');

const maxClients = 8;
let rooms = {};

const generateRoomCode = (length) => {
  let roomCode = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < length; i += 1) {
    roomCode += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }

  return roomCode;
};

const createRoom = (ws) => {
  const roomCode = generateRoomCode(4);
  rooms[roomCode] = [ws];
  ws.roomCode = roomCode;
  const message = `room created with room code: ${roomCode}`;
  console.info(message);

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode,
        message,
      },
    }),
  );
};

const joinRoom = (ws, params) => {
  const { roomCode } = params;
  if (rooms[roomCode] == null) {
    const message = `room ${roomCode} does not exist`;
    console.warn(message);
    ws.send(
      JSON.stringify({
        type: 'error',
        params: {
          message,
        },
      }),
    );
    return;
  }

  if (rooms[roomCode].length >= maxClients) {
    const message = `room ${roomCode} is full`;
    console.warn(message);
    ws.send(
      JSON.stringify({
        type: 'error',
        params: { message },
      }),
    );
    return;
  }

  rooms[roomCode].push(ws);
  ws.roomCode = roomCode;
  const message = `joined room with room code: ${roomCode}`;
  console.info(message);

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode,
        message,
      },
    }),
  );
};

const leaveRoom = (ws) => {
  const { roomCode } = ws;
  rooms[roomCode] = rooms[roomCode].filter((s) => s !== ws);
  ws.roomCode = undefined;
  console.info(`user left room ${roomCode}`);

  if (rooms[roomCode].length === 0) {
    delete rooms[roomCode];
    console.info(`deleted room ${roomCode}`);
  }
};

const broadcastToRoom = (ws, data) => {
  const { roomCode } = ws;
  console.info(`broadcasting message to room ${roomCode}: ${data}`);
  rooms[roomCode].forEach((client) => client.send(data));
};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const obj = JSON.parse(data);
      const { type, params } = obj;

      switch (type) {
        case 'create':
          createRoom(ws);
          break;
        case 'join':
          joinRoom(ws, params);
          break;
        case 'leave':
          leaveRoom(ws);
          break;
        case 'message':
          broadcastToRoom(ws, data);
          break;
        default:
          console.warn(`Type ${type} unknown`);
          break;
      }
    } catch (error) {
      console.error(error);
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        message: 'connected!',
      },
    }),
  );
});
