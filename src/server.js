import express from "express";
import dotenv from 'dotenv' // loading env files
import cookieParser from 'cookie-parser'; // needs to import here in main server file to use cookies into all routes
dotenv.config();
import redisClient from "./config/redis.js";
import { logger } from './config/logger.js'; // logger

// OTHER FILES IMPORT
import users from "./routes/Users_routes.js"; // users routes
import orders from "./routes/orders_routes.js"; // orders routes
import fileUploads from "./routes/file_routes.js"; // file upload routes
import authPages from './routes/Auth_pages.js'; // signup, login, forgetpass htmls
import authApi from './routes/Auth_api.js'; // authentication API
import googleAuth from './routes/Google_auth.js'; // Google OAuth authentication
import protectedPages from './routes/protected_pages.js'; // protected routes(dashboard page, profile page...)

// MIDDLEWARE AND HELPER FUNCTIONS
import { errorHandler } from "./middleware/Error & Logger.js";
import { startCleanupInterval } from './utils/helperFunctions.js';
import { generalRateLimit } from "./middleware/rateLimit.js";

import methodOverride from 'method-override';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log = (...args) => logger.info(args.join(' ')); // to capture all console.logs for logger
console.error = (...args) => logger.error(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({extended: false})); // It is used to take data for rq.body.....
app.use(cookieParser()); // to use cookies in all routes
app.use(methodOverride('_method'));
app.use('/api', generalRateLimit); // use rate limit only for api


app.set('view engine', 'ejs'); // setting view engine to show views
app.set('views', path.join(__dirname, '..', 'views'));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// STATIC FILES ==> to serve files like html, css, js...
app.use(express.static(path.join(__dirname, '..', 'public')));

// INTERVAL ==> cleans unverified users every 20m
startCleanupInterval();


// ROUTES
app.use('/auth', googleAuth); // Google OAuth authentication routes
app.use('/api', users); // Users routes
app.use('/api', orders); // Orders routes
app.use('/api', authApi); // Authentication routes
app.use('/api', fileUploads); // File upload routes
app.use('/', protectedPages);  // Protected pages (dashboard, profile...)
app.use('/', authPages); // Authentication pages (login, signup)




// ERROR HANDLING
app.use((req, res, next) => {
  logger.error(`404 Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404).send({error: "route not found"});
})
app.use(errorHandler) // custom middleware


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})

export default app;