const express = require('express');
const chatRouter = express.Router();
const { Chat } = require('../models/chat');
const { userAuth } = require('../middlewares/auth');
const mongoose = require('mongoose');

// ── Unread count: MUST be before the dynamic /:targetUserId route ──────────────
chatRouter.get('/chat/unread-count', userAuth, async (req, res) => {
    const userId = req.user._id;

    try {
        const chats = await Chat.find({ participants: userId, 'messages.sender': { $ne: userId } }).select('messages.sender');
        const senders = new Set();

        chats.forEach((chat) => {
            chat.messages.forEach((msg) => {
                if (msg.sender && msg.sender.toString() !== userId.toString()) {
                    senders.add(msg.sender.toString());
                }
            });
        });

        res.json({ unreadPersonsCount: senders.size });
    }
    catch (err) {
        console.error('Error fetching unread chat count:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ── Chat history by targetUserId ───────────────────────────────────────────────
chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    // Guard: prevent non-ObjectId values (e.g. "unread-count") from reaching Mongoose
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

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