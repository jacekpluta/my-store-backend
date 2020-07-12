const { forwardTo } = require("prisma-binding");

const Query = {
  item: forwardTo("db"),
  items: forwardTo("db"),
  itemsConnection: forwardTo("db"),

  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // },

  usersConnection: forwardTo("db"),
  // users: forwardTo("db"),

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
    //check for user
    if (!ctx.request.userId) {
      return null;
    }

    if (ctx.request.userId.userId) {
      const user = await ctx.db.query.user(
        //take decoded userId from express middleware
        { where: { id: ctx.request.userId.userId } },
        info
      );
      return user;
    }
  },
};

module.exports = Query;
