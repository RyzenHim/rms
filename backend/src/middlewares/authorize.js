exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRoles = req.user.roles;

        if (userRoles.includes("super_admin")) {
            return next();
        }

        const hasAccess = userRoles.some((role) =>
            allowedRoles.includes(role)
        );

        if (!hasAccess) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        next();
    };
};
