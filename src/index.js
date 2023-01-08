require('dotenv').config();
const formData = require('express-form-data');
const express = require('express');
const cors = require('cors');
const http = require('http');
const cookieParser = require('cookie-parser');

const { socketCtrl } = require('./controllers');
const routers = require('./routes');
const { PORT, origin } = require('./data/storage');
const { connect } = require('./db');

const app = express();
const server = http.createServer(app);
socketCtrl(server);

// Utility/Parser Middlewares
app.use(cors({
    origin,
    credentials: true
}));// need to add origin to cors
app.use(cookieParser());
app.use(express.json());
app.use(formData.parse());
app.use(routers);

/**
 * This is the root function of the server.
 * Everything will be executed after the database is connected.
 */
const main = async () => {
    try {
        console.log(await connect());
        server.listen(PORT, () => console.log('Server is running on port =>', PORT));
    }
    catch (e) { console.error(e) };
};
main();