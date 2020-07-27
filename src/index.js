require("dotenv").config({ path: "variables.env" });
var cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

//express middleware to handle cookies JWT
server.express.use(cookieParser());

server.express.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    //decode JWT for user ID
    const userId = jwt.verify(token, process.env.APP_SECRET);

    //set userId onto reqest for all other requests
    req.userId = userId;
  }
  next();
});

server.express.use(async (req, res, next) => {
  //check if logged in
  if (!req.userId) {
    return next();
  }

  //find user with logged user id
  try {
    const user = await db.query.user(
      { where: { id: req.userId.userId } },
      "{id,permissions,email,name}"
    );

    req.user = user;
  } catch (error) {
    throw error;
  }

  next();
});
console.log(process.env.FRONTEND_URL);
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
