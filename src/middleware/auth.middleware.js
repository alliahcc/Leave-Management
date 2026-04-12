import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'No token, authorization denied',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
        };

        if (!req.user.role) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Unauthorized: no user role found',
            });
        }

        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Token is not valid',
        });
    }
};

export default authMiddleware;