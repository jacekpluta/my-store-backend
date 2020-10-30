const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { transport, makeEmail } = require("../mail");
const stripe = require("../stripe");

const Mutation = {
  async createItem(_parrent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // relationshop between an item and user
          user: {
            connect: { id: ctx.request.userId.userId },
          },
          ...args,
        },
      },
      info
    );
    return item;
  },

  async updateItem(_parrent, args, ctx, info) {
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

  async deleteItem(_parrent, args, ctx, info) {
    const currentUserId = ctx.request.userId.userId;
    if (!currentUserId) {
      throw new Error("You must be logging in to do that");
    }

    //finding item
    const item = await ctx.db.query.item(
      { where: { id: args.id } },
      `{id title user {id}}`
    );
    const deletedItemId = item.user.id;

    if (deletedItemId !== currentUserId) {
      throw new Error("You don't have permissions to delete that item");
    }
    //check for permissions
    const currentUserPermissions = ctx.request.user.permissions;
    if (currentUserPermissions.includes("USER" || "ITEMDELETE")) {
      return ctx.db.mutation.deleteItem({ where: { id: args.id } }, info);
    } else {
      throw new Error("You don't have permissions to delete that item");
    }
  },

  async signUp(parrent, args, ctx, info) {
    const email = args.email.toLowerCase();

    const name = args.name;

    const password = await bcrypt.hash(args.password, 10);

    const permission = {
      set: "ADMIN",
    };

    const user = await ctx.db.mutation.createUser(
      {
        data: {
          name,
          email,
          password,
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

  async login(parrent, { email, password }, ctx, info) {
    email = email.toLowerCase();

    //checl for user with that email
    const user = await ctx.db.query.user({ where: { email: email } });

    if (!user) {
      throw new Error("No user found for that email");
    }

    //check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Wrong password");
    }

    //CREATE JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    console.log(token);
    //set cookie
    ctx.response.cookie("token", token, {
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    console.log(
      ctx.response.cookie("token", token, {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      })
    );
    return user;
  },

  async signOut(parrent, args, ctx, info) {
    ctx.response.clearCookie("token");

    return { message: "Sing out" };
  },

  async requestReset(parrent, args, ctx, info) {
    email = args.email.toLowerCase();

    //check for user with that email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error("No user found for that email");
    }

    const resetToken = await randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000;

    await ctx.db.mutation.updateUser({
      where: { email: email },
      data: { resetToken: resetToken, resetTokenExpiry: resetTokenExpiry },
    });

    //email reset token
    await transport.sendMail({
      from: "jacek@myshop.com",
      to: user.email,
      subject: "Your password reset link - MyShop",
      html: makeEmail(
        `Your password reset token: \n\n <a href="${
          process.env.FRONTEND_URL
        }/resetpassword?resetToken=${resetToken}">CLICK HERE</a>`
      ),
    });

    return { message: "Reseted" };
  },

  async resetPassword(parrent, args, ctx, info) {
    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords doesn't match");
    }

    //descruct user and search for all users
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error("This reset token doesn't exists or it's expired");
    }

    const password = await bcrypt.hash(args.password, 10);

    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: { password: password, resetToken: null, resetTokenExpiry: null },
    });

    //JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    //set cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return updatedUser;
  },

  async updatePermissions(parrent, args, ctx, info) {
    const userId = ctx.request.userId.userId;
    if (!userId) {
      throw new Error("You must be logging in to do that");
    }

    //check for user with that email
    const user = await ctx.db.query.user(
      {
        where: { id: userId },
      },
      info
    );

    //check for permission
    const permissionsNeeded = ["ADMIN", "PERRMISSIONUPDATE"];

    const matchedPermissions = user.permissions.filter((permissionTheyHave) =>
      permissionsNeeded.includes(permissionTheyHave)
    );

    if (!matchedPermissions.length) {
      throw new Error("You do not have sufficient permissions");
    }

    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: { id: args.userId },
      },
      info
    );
  },

  async addToCart(parrent, args, ctx, info) {
    const userId = ctx.request.userId.userId;
    const itemId = args.id;
    const size = args.size;

    if (!userId) {
      throw new Error("You must be logged in to do that");
    }

    const [cartItem] = await ctx.db.query.cartItems({
      where: { user: { id: userId }, item: { id: itemId } },
    });

    // //if alredy in the cart
    if (cartItem.size === size) {
      return ctx.db.mutation.updateCartItem(
        {
          data: { quantity: cartItem.quantity + args.quantity },
          where: { id: cartItem.id },
        },
        info
      );
    }

    return ctx.db.mutation.createCartItem({
      data: {
        item: {
          connect: { id: itemId },
        },
        user: {
          connect: { id: userId },
        },
        size: args.size,
      },
      info,
    });
  },

  async deleteCartItem(parrent, args, ctx, info) {
    const userId = ctx.request.userId.userId;
    if (!userId) {
      throw new Error("You must be logging in to do that");
    }

    const [cartItem] = await ctx.db.query.cartItems({
      where: { user: { id: userId }, item: { id: args.id } },
    });

    if (!cartItem) throw new Error("No CartItem found");
    const cartItemId = cartItem.id;

    return ctx.db.mutation.deleteCartItem({ where: { id: cartItemId } }, info);
  },

  async deleteCartItemWhenItemDeleted(parrent, args, ctx, info) {
    const userId = ctx.request.userId.userId;
    if (!userId) {
      throw new Error("You must be logging in to do that");
    }

    return ctx.db.mutation.deleteCartItem({ where: { id: args.id } }, info);
  },

  async createOrder(parrent, args, ctx, info) {
    const userId = ctx.request.userId.userId;
    if (!userId) {
      throw new Error("You must be logging in to do that");
    }

    const user = await ctx.db.query.user(
      {
        where: { id: userId },
      },
      `{id 
        name 
        email
        cart {
          id 
          quantity
          item { 
            title 
            price id 
            description 
            image 
            largeImage
          }
        }
      }
      `
    );

    const totalPrice = user.cart.reduce((all, cartItem) => {
      if (cartItem.item) return all + cartItem.quantity * cartItem.item.price;
      else return;
    }, 0);

    const charge = await stripe.charges.create({
      amount: totalPrice,
      currency: "PLN",
      source: args.token,
    });

    //user cart items from user.cart for the mutation
    const orderItems = user.cart.map((cartItem) => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: {
          connect: { id: userId },
        },
      };
      delete orderItem.id;
      return orderItem;
    });

    const order = await ctx.db.mutation
      .createOrder({
        data: {
          total: charge.amount,
          charge: charge.id,
          items: {
            create: orderItems,
          },
          user: {
            connect: { id: userId },
          },
        },
      })
      .catch((err) => console.log(err));

    //delete cart items from users cart
    const cartItemIds = user.cart.map((cartItem) => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds,
      },
    });

    return order;
  },
};

module.exports = Mutation;
