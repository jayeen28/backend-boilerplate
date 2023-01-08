const { operations } = require('../db');

/**
 * This function is a middleware that handles HTTP requests and passes them to a given entity function
 * 
 * @param {function} entity - The function that will handle the HTTP request
 * @returns {function} - A function that takes in an express request and response object and processes the request using the `entity` function
 */
function reqCtrl(entity) {
    return function (req, res) {
        const httpRequest = {
            token: req.token,
            user: req.user,
            // if the data submited with formData then the data will be in json format inside data field.
            body: (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') ? ((req.body.data && req.body.data.startsWith('{') && req.body.data.endsWith('}')) ? JSON.parse(req.body?.data || '{}') : req.body) : {},
            files: req.files,
            query: req.query,
            params: req.params,
            ip: req.ip,
            method: req.method,
            path: req.path,
            headers: {
                'Content-Type': req.headers['Content-Type'],
                'Referer': req.headers['referer'],
                'User-Agent': req.headers['user-agent']
            }
        }
        entity(httpRequest, operations)
            .then((resp = {}) => {
                if (resp?.token) {
                    res.cookie('token', resp.token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict',
                        // secure: process.env.NODE_ENV === "production"
                    });
                    delete resp.token;
                }
                res.status(isNaN(resp?.status) ? 200 : resp?.status).send(Object.freeze(resp))
            })
            .catch(err => res.status(400).send(Object.freeze({ error: err.message })));
    }
}

module.exports = reqCtrl;