const Socket = require("socket.io");
const crypto = require("crypto");

const generateRoomId = (userId, targetUserId) => {
    return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

const initializeSocket = (server) => {
    const io = Socket(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // Handle Events
        socket.on("joinChat", ({ firstname, userId, targetUserId }) => {
            const roomId = generateRoomId(userId, targetUserId);
            socket.data.roomId = roomId;
            socket.data.userId = userId;
            console.log(`${firstname} joined room ${roomId}`);
            socket.join(roomId);
        });

        socket.on("sendMessage", async ({ firstname, message, userId, targetUserId }) => {
            //Save message to database here
            try {
                const roomId = generateRoomId(userId, targetUserId);
                let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } });
                if (!chat) {
                    chat = new Chat({ participants: [userId, targetUserId], messages: [] });
                }
                const newMessage = { sender: userId, content: message, timestamp: new Date() };
                chat.messages.push(newMessage);
                await chat.save();
                socket.to(roomId).emit("receiveMessage", { firstname, message, userId });
            }
            catch (err) {
                console.error("Error saving message to database:", err);
            }
        });

        socket.on("typing", ({ userId, targetUserId }) => {
            const roomId = generateRoomId(userId, targetUserId);
            socket.to(roomId).emit("userTyping", { userId });
        });

        socket.on("disconnect", () => {
            if (socket.data.roomId && socket.data.userId) {
                io.to(socket.data.roomId).emit("userDisconnected", { userId: socket.data.userId });
            }
        });

    });
};

module.exports = initializeSocket;
