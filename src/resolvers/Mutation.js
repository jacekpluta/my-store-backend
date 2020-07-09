const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Mutation = {
  async createItem(parrent, args, ctx, info) {
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
        },
      },
      info
    );
    return item;
  },

  updateItem(parrent, args, ctx, info) {
    const updates = { ...args };

    delete updates.id;

    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },

  async deleteItem(parrent, args, ctx, info) {
    const where = { id: args.id };

    const item = await ctx.db.query.item({ where }, `{id, title}`);
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signUp(parrent, args, ctx, info) {
    args.email = args.email.toLowerCase();

    const password = await bcrypt.hash(args.password, 10);

    const permission = {
      set: "USER",
    };
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          //name, email, password
          ...args,
          password: password,
          permissions: permission,
        },
      },
      info
    );

    //JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    //set cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return user;
  },

  async signIn(parrent, { email, password }, ctx, info) {
    email = args.email.toLowerCase();

    //checl for user with that email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error("No user found for that email");
    }

    //check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid password");
    }

    //JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    //set cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return user;
  },
};

module.exports = Mutation;
