let cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24,
};

const environment = process.env.NODE_ENV || "development";

if (environment === "development") {
  cookieOptions.secure = false;
  cookieOptions.sameSite = "Lax";
} else {
  cookieOptions.secure = true;
  cookieOptions.sameSite = "None";
}

exports.cookieOptions = cookieOptions;
