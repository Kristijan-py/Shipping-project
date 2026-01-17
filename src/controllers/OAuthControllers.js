import { generateAccessToken, generateRefreshToken } from '../utils/helperFunctions.js';
import { findOAuthUser, findUserByEmailInUsersTable, createUserInUsersTable, createUserInOAuthTable, findUserById } from '../models/OAuthModels.js';

// GOOGLE OAUTH CONTROLLERS
// It handles the Google OAuth process
export const handleGoogleOAuth = async (accessToken, refreshToken, profile, cb) => {
    try {
      const user = await findOAuthUser('google', profile.id);

      if (user.length === 0) { // USER DOES NOT EXIST
        // Check again with email in users table
        let userId;
        const existingEmail = await findUserByEmailInUsersTable(profile.emails?.[0]?.value);

        if(existingEmail.length === 0){
          // If no user with that email, create a user in the database
          const userResult = await createUserInUsersTable(profile.displayName, profile.emails?.[0]?.value, 'user', 1);
          if (!userResult) {
            return cb(new Error('Failed to create user in the database'));
          }
          userId = userResult.insertId; // if  not existed, add the new id from created user
          console.log("New user created successfully!");
        } else {
          userId = existingEmail[0].id; // if existed use that user id
        }

        const insertResult = await createUserInOAuthTable(userId, 'google', profile.id);
        if (!insertResult) {
          return cb(new Error('Failed to create OAuth user in the database'));
        }
        const user = {
          id: userId,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          role: 'user'
        };

        return cb(null, user);

      } else { // IF USER EXISTS
          console.log("User already exists in the database, logging in...");

          const userRow = await findUserById(user[0].user_id);
          const userPayload = {
            id: userRow.id,
            name: userRow.name,
            email: userRow.email,
            role: userRow.user_role
          };

          return cb(null, userPayload);
        }
    } catch (error) {
      console.error('Error during Google authentication:', error.message);
      return cb(error);
    }
};


// It handles the callback after Google OAuth
export const handleGoogleOAuthCallback = async (req, res) => {

    const payload = { id: req.user.id, email: req.user.email, role: req.user.role };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // Access token
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: 'lax', // CSRF protection
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Refresh token
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,       // true in production with HTTPS
        sameSite: 'lax',  // With lax I can use it on redirects
        maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
    });

    res.redirect('/dashboard');
}



// FACEBOOK OAUTH CONTROLLERS