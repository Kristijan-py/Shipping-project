import express from "express";
import dotenv from 'dotenv' // loading env files
import cookieParser from 'cookie-parser'; // needs to import here in main server file to use cookies into all routes
dotenv.config();
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import users from "../routes/Users_routes.js";
import orders from "../routes/orders_routes.js"; // orders routes
import authPages from '../routes/Auth_pages.js';
import authApi from '../routes/Auth_api.js'; // authentication routes
import googleAuth from '../routes/Google_auth.js'; // Google OAuth authentication
import protectedRoutes from '../routes/protected_pages.js'; // protected routes(dashboard page, profile page...)
import { errorHandler, logger } from "../middleware/JWT-Error-Logger-Roles.js";
import { startCleanupInterval } from './cleanup.js';



const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({extended: false})); // It is used to take data for rq.body.....
app.use(cookieParser()); // to use cookies in all routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(logger); // just for testing purposes

// STATIC FILES ==> to serve files like html, css, js...
app.use(express.static(path.join(__dirname, '..', 'public')));

// INTERVAL ==> every 20m
startCleanupInterval();


// ROUTES
app.use('/auth', googleAuth); // Google OAuth authentication routes
app.use('/api', users); // Users routes
app.use('/api', orders); // Orders routes
app.use('/', protectedRoutes);  // Protected pages (dashboard, profile...)
app.use('/', authPages); // Authentication pages (login, signup)
app.use('/api', authApi); // Authentication routes



// ERROR HANDLING
app.use((req, res, next) => {
  res.status(404).send({error: "route not found"});
})
app.use(errorHandler) // custom middleware


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})

export default app; // exporting app for testing purposes