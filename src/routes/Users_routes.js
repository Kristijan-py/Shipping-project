import express from 'express';
import bcrypt from "bcrypt"; // hashing passwords
import dotenv from 'dotenv';
dotenv.config();
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js'; // To protect the routes

const router = express.Router();
import { getUsers, getUserById, getUserByEmail, updateUser, deleteUser } from '../repository/userRepository.js';
import { validateUserInput } from '../services/validation.js';

router.use(express.json());






// @GET all the users
router.get('/users', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const users = await getUsers();
        if (!users || users.length === 0) {
            return res.status(404).send({error: "Users not found"});
        }

        res.status(200).send(users);
    } catch (error) {
        console.log('Error fetching users: ', error.message);
        res.status(500).send({error: "Internal server error"})
    }
});


// @GET a user by id
router.get('/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await getUserById(id);
        if(!user) {
            return res.status(404).send({error: "User not found!"});
        }
        res.status(200).send(user);

    } catch (error) {
        console.log('Error fetching user: ', error.message);
        res.status(500).send({error: "Internal server error"})
    }
})


// @GET a user by email
router.get('/userByEmail', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const email = req.body.email;
        const user = await getUserByEmail(email);
        if(!user) {
            return res.status(404).send({error: "User not found!"});
        }
        res.status(200).send(user);
    } catch (error) {
        console.log('Error fetching user by email: ', error.message);
        res.status(500).send({error: "Internal server error"});
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
        console.log("Error while updating a user: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
})


// @DELETE a user by phone number --- NEED TO FIX
router.delete('/deleteUser', authenticateToken, authorizeAdmin, async (req, res) => {
    const success = await deleteUser(req.body.phone);
    if(!success) return res.status(404).send({error: "User not found with that phone number "});

    res.status(200).send({msg: "User deleted! ✅"});
})



export default router;