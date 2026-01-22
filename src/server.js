import express from "express";
import cors from 'cors';
import helmet from "helmet"; // to set various HTTP headers for app security and prevent XSS attacks(injecting malicious scripts into web pages)
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


// console.log = (...args) => logger.info(args.join(' ')); // to capture all console.logs for logger
console.error = (...args) => logger.error(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({extended: false})); // It is used to take data for rq.body.....
app.use(cookieParser()); // to use cookies in all routes
app.use(methodOverride('_method'));
app.set('trust proxy', 1); // trust first proxy (if behind a proxy like nginx, cloudflare...)

// CSP MIDDLEWARE(Content Security Policy, to secure your app from XSS attacks)
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"], // when you forgot to add a specific directive, it will fall back to this one to see what to do and because is self it will block everything external by default
            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://ka-f.fontawesome.com", "https://kit.fontawesome.com"], // add external trusted script sources
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://ka-f.fontawesome.com"], // add external trusted style sources(unsafe-inline is needed for tailwind because is written inline from class in html and for icon libraries)
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://developers.google.com","https://*.googleapis.com", "https://*.gstatic.com"], // to allow images from unsplash
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"], // to allow iframe from google
            connectSrc: ["'self'", "https://ka-f.fontawesome.com", "https://*.googleapis.com"], // to fecth from external APIs
            objectSrc: ["'none'"], // to block flash objects
            upgradeInsecureRequests: [], // to upgrade http to https
        }
    })
);


//CORS MIDDLEWARE(To prevent other domains to access your APIs)
const allowedOrigins = [process.env.BASE_URL, process.env.CLIENT_URL];
app.use(cors({
    origin: function(origin, callback){
        // allow requests with no origin(POSTMAN, Server-to-Server...)
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // only if you use cookies/sessions
}));


app.use('/api', generalRateLimit); // use rate limit only for api


app.set('view engine', 'ejs'); // setting view engine to show views
app.set('views', path.join(__dirname, 'views'));

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


// SERVER LISTENING
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})

export default app;