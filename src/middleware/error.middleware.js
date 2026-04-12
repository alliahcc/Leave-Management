const errorMiddleware = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorMiddleware;