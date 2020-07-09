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

    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    console.log("coooooooooooooookie", ctx.response.cookie);

    return user;
  },
};

module.exports = Mutation;
