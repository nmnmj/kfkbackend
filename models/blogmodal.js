import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
    {
      userId: {type:String, required:true, trim:true},
      content: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

const blogModel = mongoose.model("blog", blogSchema)

export default blogModel