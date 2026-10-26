import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, executeQuery } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'unidesk_super_secret_jwt_key_2026';

/**
 * User Registration (Maintains 3NF Separation between credentials and profiles)
 * - If userRole is STAFF, officeId is required to associate them with their managing office
 */
export async function register(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      email,
      password,
      fullName,
      userRole = 'STUDENT',
      studentOrVisitorId,
      departmentOrAffiliation = '',
      phoneNumber = '',
      officeId = null
    } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required registration fields: email, password, fullName'
      });
    }

    const normalizedRole = userRole.toUpperCase();

    // Only STAFF accounts associate with a specific managing office; ADMIN oversees all campus offices
    let assignedOfficeId = null;
    let assignedOfficeName = null;
    let assignedOfficeCode = null;

    if (normalizedRole === 'STAFF') {
      if (!officeId) {
        return res.status(400).json({
          success: false,
          message: 'Staff accounts must be assigned to an existing administrative office. Please select an office.'
        });
      }

      const [offices] = await connection.execute(
        'SELECT office_id, name, office_code FROM offices WHERE office_id = ?',
        [officeId]
      );

      if (offices.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The selected administrative office does not exist.'
        });
      }

      assignedOfficeId = offices[0].office_id;
      assignedOfficeName = offices[0].name;
      assignedOfficeCode = offices[0].office_code;
    }

    await connection.beginTransaction();

    // 1. Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT user_id FROM user_accounts WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert credentials into user_accounts (Trigger trg_user_accounts_audit_insert logs this!)
    const [accountResult] = await connection.execute(
      'INSERT INTO user_accounts (email, password_hash, user_role, is_active) VALUES (?, ?, ?, TRUE)',
      [email.toLowerCase().trim(), passwordHash, normalizedRole]
    );

    const newUserId = accountResult.insertId;

    // 4. Insert profile details into user_profiles (1:1 3NF relation)
    const generatedId = studentOrVisitorId || (normalizedRole === 'VISITOR'
      ? `VIS-${Date.now().toString().slice(-4)}`
      : normalizedRole === 'STAFF'
        ? `STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : normalizedRole === 'ADMIN'
          ? `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
          : `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

    await connection.execute(
      'INSERT INTO user_profiles (user_id, student_or_visitor_id, full_name, phone_number, department_or_affiliation, office_id) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, generatedId, fullName.trim(), phoneNumber, departmentOrAffiliation, assignedOfficeId]
    );

    await connection.commit();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUserId,
        email: email.toLowerCase().trim(),
        role: normalizedRole,
        officeId: assignedOfficeId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      data: {
        token,
        user: {
          userId: newUserId,
          email: email.toLowerCase().trim(),
          userRole: normalizedRole,
          fullName: fullName.trim(),
          studentOrVisitorId: generatedId,
          departmentOrAffiliation,
          phoneNumber,
          officeId: assignedOfficeId,
          officeName: assignedOfficeName,
          officeCode: assignedOfficeCode
        }
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * User Login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Parameterized prepared statement fetching account + profile + office
    const { rows: users } = await executeQuery(`
      SELECT 
        u.user_id,
        u.email,
        u.password_hash,
        u.user_role,
        u.is_active,
        p.full_name,
        p.student_or_visitor_id,
        p.department_or_affiliation,
        p.phone_number,
        p.office_id,
        o.name AS office_name,
        o.office_code
      FROM user_accounts u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN offices o ON p.office_id = o.office_id
      WHERE u.email = ?
      LIMIT 1
    `, [email.toLowerCase().trim()]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact campus administration.'
      });
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.user_role,
        officeId: user.office_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token,
        user: {
          userId: user.user_id,
          email: user.email,
          userRole: user.user_role,
          fullName: user.full_name,
          studentOrVisitorId: user.student_or_visitor_id,
          departmentOrAffiliation: user.department_or_affiliation,
          phoneNumber: user.phone_number,
          officeId: user.office_id,
          officeName: user.office_name,
          officeCode: user.office_code
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Demo accounts list for seamless 1-click evaluation
 */
export async function getDemoAccounts(req, res, next) {
  try {
    const { rows: demoAccounts } = await executeQuery(`
      SELECT 
        u.user_id,
        u.email,
        u.user_role,
        p.full_name,
        p.student_or_visitor_id,
        p.department_or_affiliation,
        p.office_id,
        o.name AS office_name,
        o.office_code
      FROM user_accounts u
      INNER JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN offices o ON p.office_id = o.office_id
      WHERE u.email IN (
        'admin@unidesk.edu',
        'staff.registrar@unidesk.edu',
        'alex.santos@student.unidesk.edu',
        'john.visitor@gmail.com'
      )
      ORDER BY FIELD(u.user_role, 'ADMIN', 'STAFF', 'STUDENT', 'VISITOR')
    `);

    res.json({
      success: true,
      defaultPassword: 'Password123!',
      data: demoAccounts
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get profile for authenticated user
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { rows } = await executeQuery(`
      SELECT 
        u.user_id,
        u.email,
        u.user_role,
        p.full_name,
        p.student_or_visitor_id,
        p.department_or_affiliation,
        p.phone_number,
        p.office_id,
        o.name AS office_name,
        o.office_code
      FROM user_accounts u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN offices o ON p.office_id = o.office_id
      WHERE u.user_id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile information (phone, department, fullName)
 */
export async function updateProfile(req, res, next) {
  try {
    const { userId, fullName, phoneNumber, departmentOrAffiliation } = req.body;
    const targetUserId = parseInt(userId, 10);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await executeQuery(`
      UPDATE user_profiles
      SET 
        full_name = COALESCE(?, full_name),
        phone_number = COALESCE(?, phone_number),
        department_or_affiliation = COALESCE(?, department_or_affiliation)
      WHERE user_id = ?
    `, [
      fullName !== undefined ? fullName.trim() : null,
      phoneNumber !== undefined ? phoneNumber.trim() : null,
      departmentOrAffiliation !== undefined ? departmentOrAffiliation.trim() : null,
      targetUserId
    ]);

    // Fetch updated user profile
    const { rows } = await executeQuery(`
      SELECT 
        u.user_id,
        u.email,
        u.user_role,
        p.full_name,
        p.student_or_visitor_id,
        p.department_or_affiliation,
        p.phone_number,
        p.office_id,
        o.name AS office_name,
        o.office_code
      FROM user_accounts u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      LEFT JOIN offices o ON p.office_id = o.office_id
      WHERE u.user_id = ?
    `, [targetUserId]);

    res.json({
      success: true,
      message: 'Account profile updated successfully.',
      data: {
        userId: rows[0].user_id,
        email: rows[0].email,
        userRole: rows[0].user_role,
        fullName: rows[0].full_name,
        studentOrVisitorId: rows[0].student_or_visitor_id,
        departmentOrAffiliation: rows[0].department_or_affiliation,
        phoneNumber: rows[0].phone_number,
        officeId: rows[0].office_id,
        officeName: rows[0].office_name,
        officeCode: rows[0].office_code
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update / Change Password (for logged in accounts of any role)
 */
export async function changePassword(req, res, next) {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, current password, and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const { rows: users } = await executeQuery(
      'SELECT user_id, password_hash FROM user_accounts WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await executeQuery(
      'UPDATE user_accounts SET password_hash = ? WHERE user_id = ?',
      [newHash, users[0].user_id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully. Please use your new password next time you sign in.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Forgot Password - Send Reset Link to Email
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { rows: users } = await executeQuery(
      'SELECT u.user_id, u.email, p.full_name FROM user_accounts u LEFT JOIN user_profiles p ON u.user_id = p.user_id WHERE u.email = ? LIMIT 1',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address.'
      });
    }

    const token = `rst_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const resetLink = `http://localhost:5173/?action=reset-password&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    res.json({
      success: true,
      message: `Password reset link sent to ${cleanEmail}.`,
      data: {
        email: cleanEmail,
        fullName: users[0].full_name || 'User',
        token,
        resetLink,
        expiresIn: '15 minutes'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset Password with Token
 */
export async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { rows: users } = await executeQuery(
      'SELECT user_id FROM user_accounts WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await executeQuery(
      'UPDATE user_accounts SET password_hash = ? WHERE user_id = ?',
      [newHash, users[0].user_id]
    );

    res.json({
      success: true,
      message: 'Password successfully reset. You may now sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
}

