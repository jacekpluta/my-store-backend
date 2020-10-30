let cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24,
};
if (process.env.NODE_ENV === "development") {
  cookieOptions.secure = true;
  cookieOptions.sameSite = "None";
} else {
  cookieOptions.sameSite = "Lax";
  cookieOptions.secure = false;
}

exports.cookieOptions = cookieOptions;
