require("dotenv").config({ path: "variables.env" });
var cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const createServer = require("./createServer");
const { db } = require("./db");

const server = createServer();

//express middleware to handle coockie JWT
server.express.use(cookieParser());

//decode JWT for user ID
server.express.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    console.log(userId);
    //userId onto req for other requests
    req.userId = userId;
  }
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  (deets) => {
    console.log(`server running on ${deets.port}`);
  }
);
