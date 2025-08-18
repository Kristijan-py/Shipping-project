import express from 'express';
import bcrypt from "bcrypt"; // hashing passwords
import dotenv from 'dotenv';
dotenv.config();
import { authenticateToken, authorizeAdmin } from '../middleware/auth_roles.js'; // To protect the routes


import { getUsers, getUserById, getUserByEmail, updateUser, deleteUser } from '../repository/userRepository.js';
import { validateUserInput } from '../services/validation.js';
import { AppError } from '../utils/AppError.js';
import redisClient from '../config/redis.js'; // Redis client for caching

const router = express.Router();
router.use(express.json());


const defaultTTL = 3600; // for cache expiration



// @GET all the users
router.get('/users', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const cachedUsers = await redisClient.get('users');
        // Check if users are cached
        if(cachedUsers) {
            console.log('Cache hit');
            return res.status(200).send(JSON.parse(cachedUsers));
        }
        // If not cached, fetch from DB
        const users = await getUsers();
        if (!users || users.length === 0) {
            return res.status(404).send({error: "Users not found"});
        }
        console.log('Cache miss');
        res.status(200).send(users);

        // Cache the users
        await redisClient.setEx('users', defaultTTL, JSON.stringify(users));

    } catch (error) {
        throw new AppError(`Error fetching users: ${error.message}`, 500);
    }
});


// @GET a user by id
router.get('/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const cachedUsers = await redisClient.get(`users:${id}`);
        if(cachedUsers) {
            console.log('Cache hit');
            return res.status(200).send(JSON.parse(cachedUsers));
        }

        const user = await getUserById(id);
        if(!user) {
            return res.status(404).send({error: "User not found!"});
        }
        console.log('Cache miss');
        res.status(200).send(user);

        await redisClient.setEx(`users:${id}`, defaultTTL, JSON.stringify(user));

    } catch (error) {
        throw new AppError(`Error fetching user: ${error.message}`, 500);
    }
});


// @PUT a user (update)  --- NEED TO FIX
router.put('/updateUser', authenticateToken, authorizeAdmin, async (req, res) => {
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
        throw new AppError(`Error while updating a user: ${error.message}`, 500);
    }
})


// @DELETE a user by id
router.delete('/deleteUser/:id', authenticateToken, async (req, res) => {
    try {
        if(req.user.id !== parseInt(req.params.id)){ // check if user's id is the same as the one to delete
            return res.status(403).send({error: "You are not allowed to delete this user"});
        }
        // Here we should add pop up for ask the user again is he sure about deleting his account(frontend)
    
        const success = await deleteUser(req.params.id);
        if(!success) return res.status(404).send({error: "User not found with that id "});

        await redisClient.del(`users:${req.params.id}`);
        await redisClient.del('users');

        res.redirect('/login'); 
        
    } catch (error) {
        throw new AppError(`Error deleting user: ${error.message}`, 500);
    }
})




export default router;