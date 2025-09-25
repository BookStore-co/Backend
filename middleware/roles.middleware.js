const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    try {
      // The JWT middleware should have already set req.user
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message:
            "Forbidden: You don't have enough permission to access this resource",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Token invalid" });
    }
  };
};

module.exports = authorizedRoles;
