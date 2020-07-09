const { forwardTo } = require("prisma-binding");

const Query = {
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  async user(parent, args, ctx, info) {
    //check for user
    if (!ctx.request.userId.userId) {
      return null;
    } else {
      const user = await ctx.db.query.user(
        //take  decoded userId from express middleware
        { where: { id: ctx.request.userId.userId } },
        info
      );

      return user;
    }
  },
  items: forwardTo("db"),
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // },
};

module.exports = Query;
