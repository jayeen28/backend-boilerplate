const { decodeAuthToken } = require('../utils');
/**
 * This middleware is used for authorize the socketid if the connection comes with a authoriation token.
 * NOTE: It only works after login there is a function called "authenticateEvents" to authenticate the token after login.
 * @param {Object} socket The socket object. 
 * @param {Function} next Function to move forward
 */
module.exports = async (socket, next) => {
    try {
        const token = socket.handshake.headers['authorization']?.replace('Bearer ', '');
        if (!token) return next(new Error('Unauthorized'));
        const user = await decodeAuthToken(token);
        if (!user) return next(new Error('Unauthorized'));
        socket.user = user;
        next();
    }
    catch (e) { console.log(e) };
};