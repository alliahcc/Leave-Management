import Joi from 'joi';

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // return all errors, not just the first one
            stripUnknown: true, // remove unknown fields
        });

        if (error) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: error.details.map((detail) => detail.message).join(', '),
            });
        }

        // Attach validated (cleaned) body
        req.body = value;
        next();
    };
};

export default validate;