import User from "../models/user.models.js";
import Organization from "../models/organization.models.js";
import { generateToken } from "../middleware/auth.js";

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, department, role } =
      req.body;

    let { organizationId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Handle organization assignment
    if (!organizationId) {
      // Check if user wants to create a new organization
      const { newOrgName, newOrgDomain } = req.body;

      if (newOrgName) {
        // Create new organization with provided details
        const domain = newOrgDomain || email.split("@")[1];

        const organization = new Organization({
          name: newOrgName,
          domain: domain,
          subscription: {
            plan: "free",
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            maxAssets: 10,
            features: ["basic_scanning"],
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripePriceId: null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
          },
          settings: {
            allowUserRegistration: true,
            requireEmailVerification: false,
          },
          isActive: true,
        });

        await organization.save();
        console.log(
          `Created new organization: ${organization.name} for domain: ${domain}`
        );
        organizationId = organization._id;
      } else {
        // Auto-create organization based on email domain
        const emailDomain = email.split("@")[1];

        // Try to find existing organization by domain
        let organization = await Organization.findOne({
          domain: emailDomain,
        });

        if (!organization) {
          // Create new organization for this domain
          organization = new Organization({
            name: `${
              emailDomain.split(".")[0].charAt(0).toUpperCase() +
              emailDomain.split(".")[0].slice(1)
            } Organization`,
            domain: emailDomain,
            subscription: {
              plan: "free",
              status: "active",
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
              maxAssets: 10,
              features: ["basic_scanning"],
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              stripePriceId: null,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            },
            settings: {
              allowUserRegistration: true,
              requireEmailVerification: false,
            },
            isActive: true,
          });

          await organization.save();
          console.log(
            `Created new organization: ${organization.name} for domain: ${emailDomain}`
          );
        }

        organizationId = organization._id;
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: role || "user", // Default to user, only admin can create admin accounts
      organization: organizationId, // Add organization reference
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      organization: user.organization,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      organization: user.organization,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      department: req.user.department,
      role: req.user.role,
      assignedAssets: req.user.assignedAssets,
      createdAt: req.user.createdAt,
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, department },
      { new: true, runValidators: true }
    ).select("-password");

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    const usersResponse = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      assignedAssets: user.assignedAssets,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

    res.json({ users: usersResponse });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Admin: Assign asset to user or admin
export const assignAsset = async (req, res) => {
  try {
    const { userId, macAddress, macAddresses } = req.body;

    // Validate input
    if (
      !userId ||
      (!macAddress && (!macAddresses || macAddresses.length === 0))
    ) {
      return res.status(400).json({
        error: "User ID and at least one MAC address are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Support both single and multiple asset assignment
    const assetsToAssign = macAddresses || [macAddress];
    let newAssignments = 0;

    for (const asset of assetsToAssign) {
      if (!user.assignedAssets.includes(asset)) {
        user.assignedAssets.push(asset);
        newAssignments++;
      }
    }

    if (newAssignments > 0) {
      await user.save();
    }

    res.json({
      message: `${newAssignments} asset(s) assigned successfully to ${user.role} ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        assignedAssets: user.assignedAssets,
      },
      newAssignments,
      totalAssets: user.assignedAssets.length,
    });
  } catch (error) {
    console.error("Assign asset error:", error);
    res.status(500).json({ error: "Failed to assign asset" });
  }
};

// Admin: Remove asset from user or admin
export const removeAsset = async (req, res) => {
  try {
    const { userId, macAddress, macAddresses } = req.body;

    // Validate input
    if (
      !userId ||
      (!macAddress && (!macAddresses || macAddresses.length === 0))
    ) {
      return res.status(400).json({
        error: "User ID and at least one MAC address are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const initialAssetCount = user.assignedAssets.length;

    // Support both single and multiple asset removal
    const assetsToRemove = macAddresses || [macAddress];

    user.assignedAssets = user.assignedAssets.filter(
      (asset) => !assetsToRemove.includes(asset)
    );

    const removedCount = initialAssetCount - user.assignedAssets.length;

    if (removedCount > 0) {
      await user.save();
    }

    res.json({
      message: `${removedCount} asset(s) removed successfully from ${user.role} ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        assignedAssets: user.assignedAssets,
      },
      removedCount,
      totalAssets: user.assignedAssets.length,
    });
  } catch (error) {
    console.error("Remove asset error:", error);
    res.status(500).json({ error: "Failed to remove asset" });
  }
};

// Admin: Bulk assign multiple assets to multiple users
export const bulkAssignAssets = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { userId, macAddresses }

    if (
      !assignments ||
      !Array.isArray(assignments) ||
      assignments.length === 0
    ) {
      return res.status(400).json({
        error: "Assignments array is required",
      });
    }

    const results = [];
    let totalAssignments = 0;

    for (const assignment of assignments) {
      const { userId, macAddresses } = assignment;

      if (!userId || !macAddresses || macAddresses.length === 0) {
        continue;
      }

      const user = await User.findById(userId);
      if (!user) {
        results.push({
          userId,
          error: "User not found",
          success: false,
        });
        continue;
      }

      let newAssignments = 0;
      for (const macAddress of macAddresses) {
        if (!user.assignedAssets.includes(macAddress)) {
          user.assignedAssets.push(macAddress);
          newAssignments++;
          totalAssignments++;
        }
      }

      if (newAssignments > 0) {
        await user.save();
      }

      results.push({
        userId: user._id,
        username: user.username,
        role: user.role,
        newAssignments,
        totalAssets: user.assignedAssets.length,
        success: true,
      });
    }

    res.json({
      message: `Bulk assignment completed: ${totalAssignments} total assignments`,
      results,
      totalAssignments,
      processedUsers: results.length,
    });
  } catch (error) {
    console.error("Bulk assign assets error:", error);
    res.status(500).json({ error: "Failed to bulk assign assets" });
  }
};

// Admin: Get assignment statistics
export const getAssignmentStatistics = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username role assignedAssets department"
    );

    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter((u) => u.role === "admin").length,
      totalRegularUsers: users.filter((u) => u.role === "user").length,
      usersWithAssets: users.filter((u) => u.assignedAssets.length > 0).length,
      usersWithoutAssets: users.filter((u) => u.assignedAssets.length === 0)
        .length,
      totalAssignedAssets: users.reduce(
        (sum, u) => sum + u.assignedAssets.length,
        0
      ),
      averageAssetsPerUser: 0,
      maxAssetsPerUser: Math.max(...users.map((u) => u.assignedAssets.length)),
      usersByAssetCount: {
        0: users.filter((u) => u.assignedAssets.length === 0).length,
        1: users.filter((u) => u.assignedAssets.length === 1).length,
        "2-5": users.filter(
          (u) => u.assignedAssets.length >= 2 && u.assignedAssets.length <= 5
        ).length,
        "6+": users.filter((u) => u.assignedAssets.length > 5).length,
      },
      departmentStats: {},
    };

    // Calculate average
    if (stats.totalUsers > 0) {
      stats.averageAssetsPerUser =
        Math.round((stats.totalAssignedAssets / stats.totalUsers) * 100) / 100;
    }

    // Department statistics
    const departments = [
      ...new Set(users.map((u) => u.department).filter(Boolean)),
    ];
    for (const dept of departments) {
      const deptUsers = users.filter((u) => u.department === dept);
      stats.departmentStats[dept] = {
        users: deptUsers.length,
        totalAssets: deptUsers.reduce(
          (sum, u) => sum + u.assignedAssets.length,
          0
        ),
        averageAssets:
          deptUsers.length > 0
            ? Math.round(
                (deptUsers.reduce(
                  (sum, u) => sum + u.assignedAssets.length,
                  0
                ) /
                  deptUsers.length) *
                  100
              ) / 100
            : 0,
      };
    }

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Get assignment statistics error:", error);
    res.status(500).json({ error: "Failed to get assignment statistics" });
  }
};

// Admin: Get unassigned assets
export const getUnassignedAssets = async (req, res) => {
  try {
    // This would require importing Hardware model
    const Hardware = (await import("../models/hardware.models.js")).default;

    const allAssets = await Hardware.find(
      {},
      "_id system.hostname system.mac_address"
    );
    const users = await User.find({}, "assignedAssets");

    const assignedMacAddresses = new Set();
    users.forEach((user) => {
      user.assignedAssets.forEach((mac) => assignedMacAddresses.add(mac));
    });

    const unassignedAssets = allAssets.filter(
      (asset) => !assignedMacAddresses.has(asset._id)
    );

    res.json({
      success: true,
      unassignedAssets: unassignedAssets.map((asset) => ({
        id: asset._id,
        macAddress: asset._id,
        hostname: asset.system?.hostname || "Unknown Device",
      })),
      total: unassignedAssets.length,
    });
  } catch (error) {
    console.error("Get unassigned assets error:", error);
    res.status(500).json({ error: "Failed to get unassigned assets" });
  }
};
