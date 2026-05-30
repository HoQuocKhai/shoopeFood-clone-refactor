const { Server } = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected to tracking socket:', socket.id);

      socket.on('driver:update-location', (payload) => {
        io.emit('driver:location', payload);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from tracking socket:', socket.id);
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized in Tracking module!');
    }
    return io;
  },
};
