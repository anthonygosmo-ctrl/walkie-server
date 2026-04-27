const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
  port: PORT,
});

// Rooms structure:
// {
//   "1234": Set(["sample1", "sample2"]),
//   "12345": Set(["sample3"])
// }
const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('✅ WebSocket server running');

    const { type, room, name } = msg;

    if (!room || !name) return;

    // JOIN ROOM
    if (type === 'join') {
      if (!rooms[room]) {
        rooms[room] = new Set();
      }

      rooms[room].add(name);
      ws.room = room;
      ws.name = name;

      broadcastRoom(room);
    }

    // LEAVE ROOM
    if (type === 'leave') {
      leave(ws);
    }
  });

  ws.on('close', () => {
    leave(ws);
  });
});

function leave(ws) {
  const room = ws.room;
  const name = ws.name;

  if (!room || !name || !rooms[room]) return;

  rooms[room].delete(name);

  if (rooms[room].size === 0) {
    delete rooms[room];
  } else {
    broadcastRoom(room);
  }
}

function broadcastRoom(room) {
  const members = Array.from(rooms[room]);

  const message = JSON.stringify({
    type: 'members',
    room,
    members,
  });

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.room === room
    ) {
      client.send(message);
    }
  });
}

console.log('✅ WebSocket server running on ws://localhost:8080');
