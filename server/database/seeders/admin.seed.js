require("dotenv").config();
const mongoose = require("mongoose");
const { USER } = require("../");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || password.length < 8) {
      console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 8 characters) before seeding.");
      process.exit(1);
    }

    const params = {
      firstName: "Demo",
      lastName: "Admin",
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
      mustChangePassword: true,
      active: true
    }

    const existingAdmin = await USER.findOne({ email: params.email, deleted: { $ne: true } });

    if (existingAdmin) {
      console.log("Admin already exists. Skipping seed.");
      process.exit(0);
    }
    
    const admin = await USER.create(params);

    console.log("Admin created successfully:");
    console.log({
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedAdmin();