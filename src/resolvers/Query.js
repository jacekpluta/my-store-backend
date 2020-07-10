const { forwardTo } = require("prisma-binding");

const Query = {
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),

  items: forwardTo("db"),
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // },

  async user(parent, args, ctx, info) {
    //check for user

    if (!ctx.request.userId) {
      return null;
    }

    if (ctx.request.userId.userId) {
      const user = await ctx.db.query.user(
        //take  decoded userId from express middleware
        { where: { id: ctx.request.userId.userId } },
        info
      );
      return user;
    }
  },
};

module.exports = Query;
