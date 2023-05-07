const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();
const PORT = 5000;
const http = require("http").Server(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*"
    }
});

const { addUser, addMessages, getChatHistory, getUserChatsList } = require('./utils/handleUsers');

app.use(cors());
app.use(express.json());

// app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
    // res.header('Access-Control-Allow-Origin', '*'); // enable CORS
    res.sendFile(__dirname + "/index.html");
});

app.post("/login", function (req, res) {
    res.json({ token: `kjafsdkhf;ajsdklfj;aksjdgkhasjdjhasjdghkjashdkjfh`, id: 1, name: 'arun' });
});

app.post("/getUserChatsList", function (req, res) {
    getUserChatsList(req.body.id).then(data => {
        res.json(data);
    })
});

app.post("/getChatHistory", function (req, res) {
    const user_id = req.body.user_id;
    const friend_id = req.body.friend_id;

    getChatHistory(user_id, friend_id).then(chatHistory => {
        res.json(chatHistory);
    }).catch(_ => {
        res.end();
    });
});


const users = {};
const userSocketIdMaps = []

io.on("connection", function (socket) {
    console.log('a user connected');

    socket.on("join", function (username) {
        // console.log("username :>> ", username);
        users[socket.id] = username.from;
        const newUser = {
            username: username.from,
            password: 'damn niggs',
            email: username.from + '@gmail.com'
        }
        const User = addUser(newUser);
        // console.log('User', User)

        userSocketIdMaps.push({
            socketId: socket.id,
            username: User.username,
        })
        console.log(users[socket.id] + " joined the chat");
        // console.log('users :>> ', users);
        // console.log('userSocketIdMaps', userSocketIdMaps)
    });

    socket.on("private message", (data) => {
        console.log('MSG: ', data.message, 'From: ', data.from, 'To: ', data.to);
        addMessages(data.from, data.to, data.message);
        // console.log(users, "lol");
        const to = data.to;
        // console.log("to", to);

        const recipientSocketId = Object.keys(users).find(
            (socketId) => users[socketId] === data.to
        );

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("private message", {
                from: data.from,
                to: data.to,
                message: data.message,
            });
        }
    });

    socket.on("disconnect", function () {
        console.log(users[socket.id] + " disconnected");
        delete users[socket.id];
        // pool.end();
    });
});

//create a transaction
app.post("/transactions", async (req, res) => {
    try {
        const { item, price, record_time } = req.body;
        console.log('body', item, price, record_time);

        const newTrans = await pool.query(
            "INSERT INTO transactions (item, price, record_time) VALUES ($1, $2, $3) RETURNING *",
            [item, price, record_time]
        );
        res.json(newTrans.rows[0]);
    } catch (error) {
        console.log(error.message);
    }
});

http.listen(PORT, () => {
    console.log("Server has started on port " + PORT);
});