// src/validators/user.validator.js
import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required',
        }),

    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),

    password: Joi.string()
        .min(8) // stronger minimum length
        .max(128)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).+$'))
        // requires uppercase, lowercase, digit, and special character
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required',
        }),

    role: Joi.string()
        .valid('employee', 'admin')
        .default('employee')
        .messages({
            'any.only': 'Role must be either employee or admin',
        }),
});