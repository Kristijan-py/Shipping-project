import express from "express";
import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv' // loading env files
dotenv.config();
import { AppError } from "./utils/AppError.js"; // custom error class
import cookieParser from 'cookie-parser'; // needs to import here in main server file to use cookies into all routes
import methodOverride from 'method-override';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';


// ROUTES FILES IMPORT
import users from "./routes/Users_routes.js"; // users routes
import orders from "./routes/orders_routes.js"; // orders routes
import fileUploads from "./routes/file_routes.js"; // file upload routes
import authPages from './routes/Auth_pages.js'; // signup, login, forgetpass htmls
import authApi from './routes/Auth_api.js'; // authentication API
import OAuth from './routes/OAuth_routes.js'; // Google/Facebook OAuth authentication
import protectedPages from './routes/protected_pages.js'; // protected routes(dashboard page, profile page...)


// MIDDLEWARE AND HELPER FUNCTIONS
import { errorHandler } from "./middleware/Global_Error.js";
import { startCleanupInterval } from './utils/helperFunctions.js';
import { generalRateLimit } from "./middleware/rateLimit.js";
import { logger } from './config/logger.js'; // logger


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

// setting LOGGER
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// STATIC FILES ==> to serve files like css, js...
app.use(express.static(path.join(__dirname, '..', 'public')));

// INTERVAL ==> cleans unverified users every 20m
startCleanupInterval();


// ROUTES
app.use('/auth', OAuth); // Google/Facebook OAuth authentication routes
app.use('/api', users); // Users routes
app.use('/api', orders); // Orders routes
app.use('/api', authApi); // Authentication routes
app.use('/api', fileUploads); // File upload routes
app.use('/', protectedPages);  // Protected pages (dashboard, profile...)
app.use('/', authPages); // Authentication pages (login, signup)




// ERROR HANDLING(404 NOT FOUND)
app.use((req, res, next) => {
    return res.redirect('/pages/template/404page.html');
})

app.use(errorHandler) // custom middleware


// HTTPS configuration
// const options = {
//   key: fs.readFileSync('../SHIPPING_SOFTWARE/certs/key.pem'),
//   cert: fs.readFileSync('../SHIPPING_SOFTWARE/certs/cert.pem')
// }
// const server = https.createServer(options, app);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})

export default app;