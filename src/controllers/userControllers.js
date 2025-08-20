import bcrypt from "bcrypt"; // hashing passwords
import { getUsers, getUserById, updateUser, deleteUser } from '../models/userModels.js';
import { validateUserInput } from '../services/validation.js';
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
            return res.status(404).send({error: "No users found!"});
        }

        res.status(200).send(users);
    } catch (error) {
        throw new AppError(`Error fetching users: ${error.message}`, 500);
    }
};


// @GET a user by id
export async function getUserByIdController(req, res, next) {
    try {
        const id = req.params.id;
        // Check Redis cache
        const user = await getOrSetCache(`users:${id}`, getUserById.bind(null, id), defaultTTL);
        if(!user || user.length === 0) {
            return res.status(404).send({error: "No user found!"});
        }

        res.status(200).send(user);
    } catch (error) {
        next(new AppError(`Error fetching user: ${error.message}`, 500));
    }
};


// @PUT a user (update)  --- NEED TO FIX
export async function updateUserController(req, res, next) {
    const { id, name, phone, email, password } = req.body
    try {

        const validationUser = validateUserInput(req.body);
        if(validationUser !== true){
            return res.status(400).send({error: validationUser});
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await updateUser(id, name, normalizedPhone, email, hashedPassword);
        if(!updatedUser) {
            return res.status(404).send({error: "User not found!"});
        }
        res.status(200).send(updatedUser);
    } catch (error) {
        next(new AppError(`Error while updating a user: ${error.message}`, 500));
    }
};


// @DELETE a user by id
export async function deleteUserController(req, res, next) {
    try {
        if(req.user.id !== parseInt(req.params.id)){ // check if user's id is the same as the one to delete
            return res.status(403).send({error: "You are not allowed to delete this user"});
        }
        // Here we should add pop up for ask the user again is he sure about deleting his account(frontend)
    
        const success = await deleteUser(req.params.id);
        if(!success) return res.status(404).send({error: "User not found with that id "});

        // Delete the cache also
        await redisClient.del(`users:${req.params.id}`);
        await redisClient.del('users');

        res.redirect('/login'); 
        
    } catch (error) {
        next(new AppError(`Error deleting user: ${error.message}`, 500));
    }
};
