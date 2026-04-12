const roleMiddleware = (roles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    message: 'Unauthorized: no user role found',
                });
            }

            const allowedRoles = (Array.isArray(roles) ? roles : [roles])
                .map(r => String(r).toLowerCase());
            const userRole = String(req.user.role).toLowerCase();

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: 'Access denied: insufficient permissions',
                });
            }

            next();
        } catch (err) {
            console.error('Role middleware error:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error in role middleware',
            });
        }
    };
};

export default roleMiddleware;