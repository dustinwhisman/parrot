import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
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

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode,
        message: `room created with room code: ${roomCode}`,
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

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode,
        message: `joined room with room code: ${roomCode}`,
      },
    }),
  );
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
          ws.send('left room');
          break;
        default:
          console.warn(`Type ${type} unknown`);
          break;
      }
    } catch (error) {
      console.error(error);
    }
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
