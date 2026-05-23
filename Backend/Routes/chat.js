const express = require('express');
const chatRouter = express.Router();
const { Chat } = require('../models/chat');
const { userAuth } = require('../middlewares/auth');

chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    try {
        let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } })
            .populate('messages.sender', 'firstname lastname');

        if (!chat) {
            chat = new Chat({ participants: [userId, targetUserId], messages: [] });
            await chat.save();
        }

        res.json(chat);
    }
    catch (err) {
        console.error("Error fetching chat history:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = { chatRouter };