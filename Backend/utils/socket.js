const Socket = require("socket.io");
const crypto = require("crypto");

const generateRoomId = (userId, targetUserId) => {
    return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

const initializeSocket = (server) => {
    const io = Socket(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // Handle Events
        socket.on("joinChat", ({ firstname, userId, targetUserId }) => {
            const roomId = generateRoomId(userId, targetUserId);
            console.log(firstname + "joined room" + roomId);
            socket.join(roomId);
        });

        socket.on("sendMessage", ({firstname, message, userId, targetUserId}) => {
            const roomId = generateRoomId(userId, targetUserId);
            io.to(roomId).emit("receiveMessage", { firstname, message, userId });
        });

        socket.on("typing", ({ userId, targetUserId }) => {
            const roomId = generateRoomId(userId, targetUserId);
            io.to(roomId).emit("userTyping", { userId });
        });

        socket.on("disconnect", ({ userId, targetUserId }) => {
            const roomId = generateRoomId(userId, targetUserId);
            io.to(roomId).emit("userDisconnected", { userId });
        });

    });
};

module.exports = initializeSocket;
