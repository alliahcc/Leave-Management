import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model.js';

dotenv.config();

const seedAdmin = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({ email: 'aljun.dalman@neu.edu.ph' });
        if (existingAdmin) {
            console.log('✅ Admin already exists');
            return;
        }

        const adminUser = new User({
            name: 'Aljun',
            lastName: 'Dalman',
            department: 'IT',
            position: 'System Administrator',
            role: 'admin',
            email: 'aljun.dalman@neu.edu.ph',
            password: 'Admin123', // plain text → pre-save hook will hash it
            contact: '09192888483',
            leaveBalance: 20,
            isTrashed: false,
            trashedAt: null,
            isDeleted: false,
            deletedAt: null,
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