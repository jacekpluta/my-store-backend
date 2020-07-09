const { forwardTo } = require("prisma-binding");

const Query = {
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  async me(parent, args, ctx, info) {
    //check for user
    if (!ctx.request.userId) {
      return null;
    } else {
      return ctx.db.query.user({ where: { id: ctx.request.userId } }, info);
    }
  },
  //items: forwardTo("db"),
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  },
};

module.exports = Query;
