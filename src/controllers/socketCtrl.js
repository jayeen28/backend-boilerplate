const { Server } = require('socket.io');
const { socketAuth } = require("../middlewares");
const { socketEntity } = require('../entities');
const { operations } = require('../db');

/**
 * This function initializes a new Socket.IO server and sets up connection and disconnection event listeners
 * 
 * @async
 * @param {object} server - The server object to attach the Socket.IO server to
 * NOTE: Entity function name should match with the event name you are giving.
 */
const start = async server => {
    try {
        global.io = new Server(server); //need to add cors
        global.io.use(socketAuth);
        global.io.on('connection', socket => {
            socket.onAny((eventName, data) => {
                try {
                    socketEntity[eventName]({ socket, db: operations, data })
                }
                catch (e) {
                    console.log(e)
                }
            })
            socket.on('disconnect', socket => console.log('Diconnected =>', socket.id));
        });
    }
    catch (e) { console.log(e) }
};

module.exports = start;