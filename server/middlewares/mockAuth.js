const mockUsers = {
  netrunnerX: { username: "netrunnerX", role: "admin" },
  reliefAdmin: { username: "reliefAdmin", role: "contributor" },
};

module.exports = (req, res, next) => {
  const username = req.header("x-user");

  if (!username || !mockUsers[username]) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing user" });
  }

  console.log("Incoming request from user:", username);
  req.user = mockUsers[username];
  next();
};
