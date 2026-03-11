const path = require('path');
const fs = require('fs');

// Load .env manually
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const db = require('./backend/models');
const User = db.User;
const sequelize = db.sequelize;

async function createAdmin() {
  try {
    console.log('⏳ Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    const adminEmail = 'ganasuryasrikanta@gmail.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    
    if (existingUser) {
      console.log(`ℹ️ User ${adminEmail} already exists. Updating to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ User promoted to Admin successfully.');
    } else {
      console.log(`⏳ Creating new admin account: ${adminEmail}...`);
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: 'admin', // Will be hashed by User model hooks
        gender: 'male',
        role: 'admin'
      });
      console.log('✅ Admin account created successfully.');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    if (sequelize) await sequelize.close();
    process.exit(0);
  }
}

createAdmin();
