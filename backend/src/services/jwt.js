const jwt = require("jsonwebtoken");

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      game_role_id: user.game_role_id,
      game_server: user.game_server,
      game_role_name: user.game_role_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { signUser };
