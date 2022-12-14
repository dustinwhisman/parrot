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

const createRoom = (ws, params) => {
  const roomCode = generateRoomCode(4);
  const { name } = params;
  rooms[roomCode] = [ws];
  ws.roomCode = roomCode;
  ws.name = name;
  const message = `room created with room code: ${roomCode}. Host's name: ${name}`;
  console.info(message);

  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode,
        name,
        message,
        participants: [name],
      },
    }),
  );
};

const joinRoom = (ws, params) => {
  const { roomCode, name } = params;
  const formattedRoomCode = roomCode.toLowerCase();
  if (rooms[formattedRoomCode] == null) {
    const message = `room ${formattedRoomCode} does not exist`;
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

  if (rooms[formattedRoomCode].length >= maxClients) {
    const message = `room ${formattedRoomCode} is full`;
    console.warn(message);
    ws.send(
      JSON.stringify({
        type: 'error',
        params: { message },
      }),
    );
    return;
  }

  rooms[formattedRoomCode].push(ws);
  ws.roomCode = formattedRoomCode;
  ws.name = name;
  const message = `${name} joined room with room code: ${formattedRoomCode}`;
  console.info(message);

  const participants = rooms[formattedRoomCode].map(
    (participant) => participant.name,
  );
  ws.send(
    JSON.stringify({
      type: 'info',
      params: {
        roomCode: formattedRoomCode,
        name,
        message,
        participants,
      },
    }),
  );

  broadcastToRoom(
    ws,
    JSON.stringify({
      type: 'participant joined',
      params: {
        roomCode: formattedRoomCode,
        name,
        participants,
      },
    }),
  );
};

const leaveRoom = (ws) => {
  const { roomCode } = ws;
  rooms[roomCode] = rooms[roomCode]?.filter((s) => s !== ws) ?? undefined;
  console.info(`user left room ${roomCode}`);

  broadcastToRoom(
    ws,
    JSON.stringify({
      type: 'participant left',
      params: {
        roomCode,
        participants:
          rooms[roomCode]?.map((participant) => participant.name) ?? [],
      },
    }),
  );

  if (rooms[roomCode]?.length === 0) {
    delete rooms[roomCode];
    console.info(`deleted room ${roomCode}`);
  }
};

const broadcastToRoom = (ws, data) => {
  const { roomCode } = ws;
  console.info(`broadcasting message to room ${roomCode}: ${data}`);
  rooms[roomCode]?.forEach((client) => client.send(data));
};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const obj = JSON.parse(data);
      const { type, params } = obj;

      switch (type) {
        case 'create':
          createRoom(ws, params);
          break;
        case 'join':
          joinRoom(ws, params);
          break;
        case 'leave':
          leaveRoom(ws);
          break;
        default:
          broadcastToRoom(ws, data);
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
