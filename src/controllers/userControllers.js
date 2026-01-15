import { getUsers, deleteUser } from '../models/userModels.js';
import { AppError } from '../utils/AppError.js';
import { getOrSetCache } from '../utils/caching.js'; // Helper function for caching
import redisClient from '../config/redis.js'; // Redis client for caching


const defaultTTL = 3600; // for cache expiration


// @GET all the users
export async function getUsersController(req, res, next) {
    try {
        // Check Redis cache
        const users = await getOrSetCache('users', getUsers, defaultTTL);
        if(!users || users.length === 0) {
            throw new AppError("No users found!", 404);
        }

        res.status(200).send(users);
    } catch (error) {
        throw new AppError(`Error fetching users: ${error.message}`, 500);
    }
};


// @POST logout
export async function logoutController(req, res, next) {
    try {

        // Clear the cookies
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: 'strict'   // LAX for CSRF protection and strict for same-site requests
        }); 

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: 'strict'   // LAX for CSRF protection and strict for same-site requests
        });

        console.log("Logged out successfully ✅");
        return res.redirect('/login');
        
    } catch (error) {
        next(new AppError(`Error while logging out: ${error.message}`, 500));
    }
};


// @DELETE a user by id
export async function deleteUserController(req, res, next) {
    try {
        if(req.user.id !== parseInt(req.params.id)){ // check if user's id is the same as the one to delete(to prevent deleting other users URL)
            return res.redirect('/dashboard');
        }
    
        const success = await deleteUser(req.params.id);
        if(!success) {
            throw new AppError("User not found with that id", 404);
        }
        console.log(`User ${req.params.id} deleted successfully ✅`);

        // Delete the cache also
        await redisClient.del(`users:${req.params.id}`);
        await redisClient.del('users');

        // Delete cookies
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
        });


        res.redirect('/login'); 
        
    } catch (error) {
        next(new AppError(`Error deleting user: ${error.message}`, 500));
    }
};
