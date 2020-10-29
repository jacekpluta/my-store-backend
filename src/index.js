require("dotenv").config({ path: "variables.env" });
var cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const createServer = require("./createServer");
const db = require("./db");
const server = createServer();

server.get("/home", (req, res) => {
  return res.send("Hello");
});

//express middleware to handle cookies JWT
//parses Cookie header and populate req.cookies
server.express.use(cookieParser());

server.express.use((req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    //decode JWT for user ID
    const userId = jwt.verify(token, process.env.APP_SECRET);

    //set userId onto reqest for all other requests
    req.userId = userId.userId;
  }
  next();
});

server.express.use(async (req, res, next) => {
  //check if logged in
  if (!req.userId) {
    return next();
  }

  //if logged check if is in the base
  try {
    const user = await db.query.user(
      { where: { id: req.userId } },
      "{id,permissions,email,name}"
    );

    req.user = user;
  } catch (error) {
    throw error;
  }

  next();
});

// server.express.use(async (req, res, next) => {
//   req.aaa = "aaa";

//   next();
// });

server.start(
  {
    cors: {
      credentials: true,
      origin: [
        process.env.FRONTEND_URL,
        "https://myshoppingplace.herokuapp.com",
        "https://my-shopp.netlify.app",
      ],
    },
  },
  (deets) => {
    console.log(`server running on ${deets.port}`);
  }
);
