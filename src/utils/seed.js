const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Group = require('../models/Group');
const Session = require('../models/Session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jckc_db');
    console.log('Connected to MongoDB');

    // Create default admin user
    const adminExists = await User.findOne({ email: 'admin@jckc.com' });
    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@jckc.com',
        phoneNumber: '0000000000',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created: admin@jckc.com / admin123');
    }

    // Create default classes
    const defaultClasses = [
      { name: 'Nasareth Gem', description: 'Nasareth Gem Class for the youngest children' },
      { name: 'Holy Innocent Junior', description: 'Holy Innocent Junior Class' },
      { name: 'Holy Innocent Senior', description: 'Holy Innocent Senior Class' },
      { name: 'Future Glory Junior', description: 'Future Glory Junior Class' },
      { name: 'Future Glory Senior', description: 'Future Glory Senior Class' }
    ];

    for (const classData of defaultClasses) {
      const exists = await Class.findOne({ name: classData.name });
      if (!exists) {
        await Class.create(classData);
        console.log(`Class created: ${classData.name}`);
      }
    }

    // Create default groups
    const defaultGroups = [
      { name: 'Kingdom Choir', description: 'Kingdom Choir Group for singing' },
      { name: 'Kingdom Dancers', description: 'Kingdom Dancers Group for dancing' }
    ];

    for (const groupData of defaultGroups) {
      const exists = await Group.findOne({ name: groupData.name });
      if (!exists) {
        await Group.create(groupData);
        console.log(`Group created: ${groupData.name}`);
      }
    }

    // Create default sessions
    const defaultSessions = [
      { name: 'Technical Team', description: 'Technical Team for technical support' },
      { name: 'Welfare Team', description: 'Welfare Team for welfare activities' }
    ];

    for (const sessionData of defaultSessions) {
      const exists = await Session.findOne({ name: sessionData.name });
      if (!exists) {
        await Session.create(sessionData);
        console.log(`Session created: ${sessionData.name}`);
      }
    }

    console.log('\nDatabase seeding completed!');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@jckc.com');
    console.log('Password: admin123');
    console.log('\nPlease change the admin password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
