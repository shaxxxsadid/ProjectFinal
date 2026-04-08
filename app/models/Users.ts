import { Schema, model, models } from 'mongoose';

/* Credentials User model definition 
    - username: optional string
    - email: string (required, unique)
    - firstName: optional string    
    - lastName: optional string
    - avatar: optional object with fileName, type, and data (Buffer)
    - passwordHash: string
    - roleId: ObjectId reference to Role model
    - businessProfileId: ObjectId reference to BusinessProfile model
    - isActive: boolean (default true)
    - lastLogin: Date
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
*/
const userSchema = new Schema({
    username: { type: String },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    avatar: {
        fileName: { type: String, required: false },
        type: { type: String, required: false },
        data: { type: Buffer, required: false }
    },
    passwordHash: { type: String},
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    businessProfileId: { type: Schema.Types.ObjectId, ref: 'BusinessProfile' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
}, { timestamps: true });

export const Users = models['Users'] || model('Users', userSchema, 'Users');
