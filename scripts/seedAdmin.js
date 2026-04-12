import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model.js';

dotenv.config();

const seedAdmin = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const existingAdmin = await User.findOne({ email: 'alliahalexis.cinco@neu.edu.ph' });
        if (existingAdmin) {
            console.log('✅ Admin already exists');
            return;
        }

        const adminUser = new User({
            name: 'Administrator',
            email: 'alliahalexis.cinco@neu.edu.ph',
            password: 'Admin123', // plain text → pre-save hook will hash it
            role: 'admin',
            leaveBalance: 20,
        });

        await adminUser.save();
        console.log('✅ Admin seeded successfully with password: Admin123');
    } catch (err) {
        console.error('❌ Error seeding admin:', err.message);
    } finally {
        await mongoose.connection.close();
    }
};

seedAdmin();