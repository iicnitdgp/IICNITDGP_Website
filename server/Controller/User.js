const User = require('../model/User');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/mail');
const RedisClient = require('../config/redis');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, address, photo, designation, type, extra } = req.body;
    const userId = req.user.userId;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (photo) updateData.photo = photo;
    if (designation) updateData.designation = designation;
    if (type) updateData.type = type;
    if (extra) updateData.extra = extra;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Admin: Create new user
exports.createUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { name, email, phone, address, role = 'user', photo, designation, type, extra, rank } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Use phone number as password (as requested)
    const password = phone;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      address,
      role,
      photo,
      createdBy: req.user.userId,
      designation,
      type,
      extra,
      rank: rank !== undefined && rank !== null && rank !== '' ? Number(rank) : undefined
    });

    const savedUser = await newUser.save();

    // Remove sensitive information before sending response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse,
      temporaryPassword: phone // Let admin know the temporary password
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};


// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP for security
        const hashedOtp = bcrypt.hashSync(otp, 10);
        
        // Store OTP in Redis with 10 minutes expiry
        const redisKey = `forgot_password_otp_${email}`;
        await RedisClient.setEx(redisKey, 600, hashedOtp); // 10 minutes expiry

        // Send OTP via email
        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset OTP</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 10px;">Password Reset Request</h2>
                        <div style="width: 50px; height: 3px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
                    </div>
                    
                    <p style="color: #555; margin-bottom: 20px;">Hello <strong>${user.name}</strong>,</p>
                    
                    <p style="color: #555; margin-bottom: 25px;">You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                            ${otp}
                        </div>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="color: #666; margin: 0; font-size: 14px;">
                            <strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong> for security reasons.
                        </p>
                    </div>
                    
                    <p style="color: #555; margin-bottom: 20px;">If you didn't request this password reset, please ignore this email and your account will remain secure.</p>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            This is an automated message from IIC NIT Durgapur. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, 'Password Reset OTP', emailContent);

        res.status(200).json({ 
            success: true, 
            message: 'OTP sent to your email successfully' 
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP', 
            error: err.message 
        });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and OTP are required' 
            });
        }

        // Retrieve hashed OTP from Redis
        const redisKey = `forgot_password_otp_${email}`;
        const hashedOtp = await RedisClient.get(redisKey);
        if (!hashedOtp) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired or not found' 
            });
        }

        // Compare provided OTP with hashed OTP
        const isMatch = bcrypt.compareSync(otp, hashedOtp);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }

        // OTP verified successfully - don't delete it yet, 
        // keep it for password reset validation
        res.status(200).json({ 
            success: true, 
            message: 'OTP verified successfully' 
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify OTP', 
            error: err.message 
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, OTP, and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Verify OTP again before password reset
        const redisKey = `forgot_password_otp_${email}`;
        const hashedOtp = await RedisClient.get(redisKey);
        
        if (!hashedOtp) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired or not found' 
            });
        }

        const isMatch = bcrypt.compareSync(otp, hashedOtp);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }

        // Find the user by email (explicitly include password field)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if the new password is the same as the current password (only if user has a current password)
        if (user.password) {
            const isPasswordSame = bcrypt.compareSync(newPassword, user.password);
            if (isPasswordSame) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'New password cannot be the same as the old password' 
                });
            }
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await User.findOneAndUpdate(
            { email: email.toLowerCase() }, 
            { 
                password: hashedPassword,
                refreshToken: null // Invalidate refresh token to force re-login
            }
        );

        // Delete OTP from Redis after successful password reset
        await RedisClient.del(redisKey);

        res.status(200).json({ 
            success: true, 
            message: 'Password reset successfully' 
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password', 
            error: err.message 
        });
    }
};




// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        usersPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
  try {
    // Check if user is admin or requesting their own profile
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const { name, email, phone, address, role, photo, designation, type, extra, isActive, rank } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (role) updateData.role = role;
    if (photo) updateData.photo = photo;
    if (designation) updateData.designation = designation;
    if (type) updateData.type = type;
    if (extra) updateData.extra = extra;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (rank !== undefined && rank !== null && rank !== '') updateData.rank = Number(rank);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Public: Get team members (active users with type and designation)
exports.getTeamMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      type
    } = req.query;

    // First, let's see what users we have
    const allUsers = await User.find({}).select('_id name photo designation type extra isActive');
    console.log('All users in database:', allUsers.length);
    console.log('Sample users:', allUsers.slice(0, 3));

    // Build query for active users - make it less restrictive initially
    const query = {
      isActive: { $ne: false } // Include users where isActive is true or undefined
    };
    
    if (type && type !== 'All') {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query - order by rank first (lower rank shows first), falling back
    // to createdAt ascending so users added earlier come first when rank ties/unset
    const users = await User.find(query)
      .select('_id name photo designation type extra isActive rank')
      .sort({ rank: 1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Filtered users:', users.length);
    console.log('Filtered users sample:', users.slice(0, 2));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        usersPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message
    });
  }
};

// Admin: Get users for management (simplified view)
exports.getUsersForManagement = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by active / inactive status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Filter by designation type (Faculty, Student Council, Student Volunteers, etc.)
    if (type && type !== 'all') {
      query.type = type;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query - fields needed for the management table and edit card
    const users = await User.find(query)
      .select('_id name email phone address photo role designation type extra isActive rank createdAt lastLogin')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        usersPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users for management error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for management',
      error: error.message
    });
  }
};

// Admin: Update user management (simplified update)
exports.updateUserManagement = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const { name, email, phone, address, photo, role, designation, type, extra, isActive, rank } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Prevent admin from changing their own role to user
    if (id === req.user.userId && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role from admin to user'
      });
    }

    // Prepare update object
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      role,
      isActive: typeof isActive === 'boolean' ? isActive : true
    };
    if (address !== undefined) updateData.address = address;
    if (photo) updateData.photo = photo;
    if (designation !== undefined) updateData.designation = designation;
    if (type) updateData.type = type;
    if (extra) updateData.extra = extra;
    if (rank !== undefined && rank !== null && rank !== '') updateData.rank = Number(rank);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('_id name email phone address photo role designation type extra isActive rank createdAt lastLogin');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user management error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Debug: Get all users for testing
exports.getAllUsersDebug = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id name email phone designation type extra isActive createdAt')
      .limit(10);

    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        type: user.type,
        isActive: user.isActive,
        hasExtra: !!user.extra,
        extraFields: user.extra ? Object.keys(user.extra) : []
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for debug',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Find user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      refreshToken: null // Invalidate refresh token to force re-login
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
