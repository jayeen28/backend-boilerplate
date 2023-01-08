const router = require('express').Router();
const user = require('./user');
const image = require('./image');

const v1 = [
    user,
    image
];

module.exports = router.use('/v1', v1);