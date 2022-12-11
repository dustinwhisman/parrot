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

const sendGeneralInformation = (ws) => {
  const obj = {
    type: 'info',
    params: {
      roomCode: ws.roomCode ?? 'no room',
      numberOfClients: ws.roomCode ? rooms[ws.roomCode].length : 0,
    },
  };

  ws.send(JSON.stringify(obj));
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
          // join room
          ws.send('joined room');
          break;
        case 'leave':
          // leave room
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
