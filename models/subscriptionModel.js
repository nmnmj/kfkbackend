import mongoose from 'mongoose'

const subsSchema = new mongoose.Schema({
    subscribers: { type: [String], default: [], required: true, trim: true },
    userId: {type: Number, required: true, trim: true},
})

const subsModel = mongoose.model("subscription", subsSchema)

export default subsModel