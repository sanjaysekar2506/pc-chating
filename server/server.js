const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb+srv://sanjaycw24:sanjay2001@cluster0.btkji.mongodb.net/chatapp", { 
    useNewUrlParser: true,
     useUnifiedTopology: true })

.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

const MessageSchema = new mongoose.Schema({
    user: Number,
    content: String,
    type: String, // "text" or "image"
});

const Message = mongoose.model("Message", MessageSchema);
// Cloudinary Configuration
cloudinary.config({
  cloud_name: "dfvtklmnm",
  api_key: "717559563742696",
  api_secret: "_aCLynabbQ7rQRqcx7wj-OfJHjo",
});

// Multer Setup for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload Image to Cloudinary
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
            if (error) return res.status(500).json({ error: "Upload failed" });
            res.json({ url: result.secure_url });
        }).end(req.file.buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save Message to MongoDB
app.post("/messages", async (req, res) => {
    try {
        let { user, content, type } = req.body;
        let newMessage = new Message({ user, content, type });
        await newMessage.save();
        res.json({ success: true, message: "Message saved" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save message" });
    }
});

// Fetch All Messages
app.get("/messages", async (req, res) => {
    try {
        let messages = await Message.find();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to load messages" });
    }
});

// Delete All Messages of a User
app.delete("/messages/:user", async (req, res) => {
    try {
        let user = req.params.user;
        await Message.deleteMany({ user: user });
        res.json({ success: true, message: "Messages deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete Image from Cloudinary
app.post("/delete-image", async (req, res) => {
    try {
        let imageUrl = req.body.imageUrl;

        // Extract public_id from Cloudinary URL
        let publicId = imageUrl.split("/").pop().split(".")[0];

        await cloudinary.uploader.destroy(publicId);
        res.json({ success: true, message: "Image deleted from Cloudinary" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
