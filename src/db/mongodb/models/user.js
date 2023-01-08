const { Schema, model } = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const userSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    avatar: { type: String },
    bio: { type: String },
    role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
    online: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    tokens: [{ type: String, unique: true }]
}, { timestamps: true });

userSchema.plugin(paginate);

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    delete obj.updatedAt;
    delete obj.createdAt;
    delete obj.tokens;
    delete obj.password;
    return obj;
};

module.exports = model('User', userSchema); 