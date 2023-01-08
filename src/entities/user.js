const imgCtrl = require("../controllers/imgCtrl");
const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const createAllowed = new Set(['fullName', 'email', 'password', 'phone']);
const ownUpdateAllowed = new Set(['fullName', 'email', 'avatar', 'phone', 'bio', 'online']);
const updateAllowed = new Set(['fullName', 'email', 'avatar', 'phone', 'bio', 'role', 'active']);

/**
 * Creates a new user in the database with the specified properties in the request body.
 * The 'role' property is automatically set to 'user', and the 'password' property is hashed using bcrypt.
 * A JWT token is also generated for the user and added to the 'tokens' array.
 *
 * @param {Object} req - The request object containing the properties for the new user.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} The created user object, including the JWT token.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 */
const create = async (req, db) => {
    try {
        const valid = Object.keys(req.body).every(k => createAllowed.has(k));
        if (!valid) return { status: 400, message: 'Bad request' };
        req.body.role = 'user';
        req.body.password = await bcrypt.hash(req.body.password, 8)
        const user = await db.create({ table: 'user', key: { ...req.body } });
        user.token = jsonwebtoken.sign({ id: user._id.toString() }, process.env.SECRET);
        user.tokens = [user.token, ...user.tokens];
        await db.save(user);
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};


/**
 * Attempts to log in a user with the specified email and password in the request body.
 * If the login is successful, a JWT token is generated for the user and added to the 'tokens' array.
 *
 * @param {Object} req - The request object containing the 'email' and 'password' properties for the user.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} An object with a 'status' and 'message' property, and a 'token' property if the login is successful.
 * @throws {Error} If there is an error during the database operation.
 */
const login = async (req, db) => {
    try {
        const user = await db.findOne({ table: 'user', key: { email: req.body.email } });
        if (!user) return { status: 400, message: 'Bad request' };
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return { status: 400, message: 'Bad request' };
        user.token = jsonwebtoken.sign({ id: user._id.toString() }, process.env.SECRET);
        user.tokens = [user.token, ...user.tokens];
        user.online = true;
        await db.save(user);
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Retrieves the profile of the user with the specified ID.
 *
 * @param {Object} req - The request object containing the 'id' parameter.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} An object with the 'fullName', 'email', 'phone', and 'bio' properties of the user.
 * @throws {Error} If there is an error during the database operation.
 */
const profile = async (req, db) => {
    try {
        let user = await db.findOne({ table: 'user', key: { id: req.params.id } });
        user = { fullName: user.fullName, email: user.email, phone: user.phone, bio: user.bio }
        return user || { status: 400, message: 'Bad request' };
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Removes the specified JWT token from the 'tokens' array of the authenticated user.
 *
 * @param {Object} req - The request object containing the authenticated user and the JWT token to be removed.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} An object with a 'status' and 'message' property.
 * @throws {Error} If there is an error during the database operation.
 */
const logout = async (req, db) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token !== req.token);
        user.online = false;
        await db.save(req.user);
        return { status: 200, message: 'Success' };
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Retrieves all users that match the specified query parameters.
 *
 * @param {Object} req - The request object containing the query parameters.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Array} An array of user objects that match the query.
 * @throws {Error} If there is an error during the database operation.
 */
const getAll = async (req, db) => {
    try {
        const user = await db.find({ table: 'user', key: { query: req.query } });
        return user || [];
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong');
    }
};

/**
 * Updates the authenticated user with the specified properties in the request body.
 * If the request includes an 'avatar' file, it is processed using the 'imgCtrl' function before being set as the user's 'avatar' property.
 *
 * @param {Object} req - The request object containing the properties to be updated and, optionally, the 'avatar' file.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} The updated user object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 */
const updateOwn = async (req, db) => {
    try {
        if (req.files?.avatar?.path) req.body.avatar = await imgCtrl(req.files?.avatar.path);
        const keys = Object.keys(req.body);
        const valid = keys.every(k => ownUpdateAllowed.has(k));
        if (!valid) return { status: 400, reason: 'Bad request' };
        keys.forEach(k => req.user[k] = req.body[k]);
        return await db.save(req.user);
    }
    catch (e) {
        console.log(e)
        throw new Error('Something went wrong');
    }
};

/**
 * Update a user record in the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} db - A database client instance.
 * @return {Object} - An object with a status code and reason for unsuccessful updates, or the updated user object for successful updates.
 *
 * @throws {Error} - If there is an error processing the avatar file or interacting with the database.
 */
const update = async (req, db) => {
    try {
        if (req.files?.avatar?.path) req.body.avatar = await imgCtrl(req.files?.avatar.path);
        const keys = Object.keys(req.body);
        const valid = keys.every(k => updateAllowed.has(k));
        if (!valid) return { status: 400, reason: 'Bad request' };
        const user = await db.findOne({ table: 'user', key: { id: req.params.id } });
        if (!user) return { status: 404, reason: 'Bad request' };
        keys.forEach(k => user[k] = req.body[k]);
        return await db.save(user);
    }
    catch (e) {
        console.log(e)
        throw new Error('Something went wrong');
    }
};

/**
 * Remove a user record from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} db - A database client instance.
 * @return {Object} - An object with a status code and reason for unsuccessful removals, or the removed user object for successful removals.
 *
 * @throws {Error} - If there is an error interacting with the database.
 */
const remove = async (req, db) => {
    try {
        const user = await db.remove({ table: 'user', key: { id: req.params.id } });
        if (!user) return { status: 404, message: "Bad request" };
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong');
    }
};

module.exports = { create, login, profile, getAll, updateOwn, update, remove, logout };