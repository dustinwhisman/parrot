import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log('websocket server set up on port 8080');

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log('received: %s', data);
  });

  ws.send('something');
});
