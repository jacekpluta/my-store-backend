const { forwardTo } = require("prisma-binding");

const Query = {
  item: forwardTo("db"),
  items: forwardTo("db"),
  itemsConnection: forwardTo("db"),

  async users(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      return null;
    }
    const user = ctx.request.user;
    const permissionsNeeded = ["ADMIN", "PERRMISSIONUPDATE"];

    const matchedPermissions = user.permissions.filter((permissionTheyHave) =>
      permissionsNeeded.includes(permissionTheyHave)
    );

    if (!matchedPermissions.length) {
      throw new Error("You do not have sufficient permissions");
    }

    return ctx.db.query.users({}, info);
  },

  async user(parent, args, ctx, info) {
    console.log("ctx.request.userId", ctx.request.userId);

    //check for user in request from server.express.use
    if (!ctx.request.userId) {
      return null;
    }

    if (ctx.request.userId) {
      const user = await ctx.db.query.user(
        //take decoded userId from express middleware
        { where: { id: ctx.request.userId } },
        info
      );

      return user;
    }
  },

  async order(parent, args, ctx, info) {
    //check for user
    if (!ctx.request.userId) {
      return null;
    }

    const order = await ctx.db.query.order({ where: { id: args.id } }, info);

    const checkIfOwnsOrder = order.user.id === ctx.request.userId.userId;
    const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes(
      "ADMIN"
    );

    if (!checkIfOwnsOrder && !hasPermissionsToSeeOrder) {
      throw new Error("You dont have rights to see this");
    }
    return order;
  },

  async orders(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      return null;
    }

    // const checkIfOwnsOrder = order.user.id === ctx.request.userId.userId;
    // const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes(
    //   "ADMIN"
    // );

    // if (!checkIfOwnsOrder && !hasPermissionsToSeeOrder) {
    //   throw new Error("You dont have rights to see this");
    // }

    const orders = await ctx.db.query.orders({ where: { id: args.id } }, info);

    return orders;
  },
};

module.exports = Query;
