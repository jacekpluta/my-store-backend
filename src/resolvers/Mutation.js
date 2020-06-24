const Mutation = {
  async createItem(paret, args, ctx, info) {
    console.log(args);
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
};

module.exports = Mutation;
