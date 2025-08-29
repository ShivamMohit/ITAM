import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import Organization from "../models/organization.models.js";
import User from "../models/user.models.js";
import Hardware from "../models/hardware.models.js";
import Software from "../models/software.models.js";
import Telemetry from "../models/telemetry.models.js";
import Ticket from "../models/ticket.models.js";

configDotenv();

const mongoUri = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const createDefaultOrganization = async () => {
  try {
    console.log("Creating default organization...");

    // Create default organization
    const defaultOrg = new Organization({
      name: "Default Organization",
      domain: "default.local",
      subscription: {
        plan: "free",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxAssets: 10,
        features: ["basic_scanning"],
      },
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
      },
    });

    await defaultOrg.save();
    console.log("Default organization created:", defaultOrg._id);
    return defaultOrg._id;
  } catch (error) {
    console.error("Error creating default organization:", error);
    throw error;
  }
};

const updateExistingUsers = async (organizationId) => {
  try {
    console.log("Updating existing users with organization...");

    // Find users without organization
    const usersWithoutOrg = await User.find({
      organization: { $exists: false },
    });
    console.log(`Found ${usersWithoutOrg.length} users without organization`);

    if (usersWithoutOrg.length > 0) {
      await User.updateMany(
        { organization: { $exists: false } },
        { organization: organizationId }
      );
      console.log("Updated users with default organization");
    }
  } catch (error) {
    console.error("Error updating users:", error);
    throw error;
  }
};

const updateExistingData = async (organizationId) => {
  try {
    console.log("Updating existing data with organization...");

    // Update hardware data
    const hardwareCount = await Hardware.countDocuments({
      organization: { $exists: false },
    });
    if (hardwareCount > 0) {
      await Hardware.updateMany(
        { organization: { $exists: false } },
        { organization: organizationId }
      );
      console.log(`Updated ${hardwareCount} hardware records`);
    }

    // Update software data
    const softwareCount = await Software.countDocuments({
      organization: { $exists: false },
    });
    if (softwareCount > 0) {
      await Software.updateMany(
        { organization: { $exists: false } },
        { organization: organizationId }
      );
      console.log(`Updated ${softwareCount} software records`);
    }

    // Update telemetry data
    const telemetryCount = await Telemetry.countDocuments({
      organization: { $exists: false },
    });
    if (telemetryCount > 0) {
      await Telemetry.updateMany(
        { organization: { $exists: false } },
        { organization: organizationId }
      );
      console.log(`Updated ${telemetryCount} telemetry records`);
    }

    // Update ticket data
    const ticketCount = await Ticket.countDocuments({
      organization: { $exists: false },
    });
    if (ticketCount > 0) {
      await Ticket.updateMany(
        { organization: { $exists: false } },
        { organization: organizationId }
      );
      console.log(`Updated ${ticketCount} ticket records`);
    }
  } catch (error) {
    console.error("Error updating existing data:", error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log("Starting organization setup...");

    // Check if default organization already exists
    const existingOrg = await Organization.findOne({
      name: "Default Organization",
    });
    let organizationId;

    if (existingOrg) {
      console.log("Default organization already exists:", existingOrg._id);
      organizationId = existingOrg._id;
    } else {
      organizationId = await createDefaultOrganization();
    }

    // Update existing users and data
    await updateExistingUsers(organizationId);
    await updateExistingData(organizationId);

    console.log("Organization setup completed successfully!");
    console.log("Default organization ID:", organizationId);

    // Display summary
    const userCount = await User.countDocuments({
      organization: organizationId,
    });
    const hardwareCount = await Hardware.countDocuments({
      organization: organizationId,
    });
    const softwareCount = await Software.countDocuments({
      organization: organizationId,
    });

    console.log("\nSummary:");
    console.log(`- Users: ${userCount}`);
    console.log(`- Hardware: ${hardwareCount}`);
    console.log(`- Software: ${softwareCount}`);
  } catch (error) {
    console.error("Setup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the setup
main();
