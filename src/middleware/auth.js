import express from "express";
import  jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

// Authenticate token
export function authenticateToken(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return res.redirect('/login');

    // Verify the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    }); 
}

// Redirect to dashboard if authenticated, otherwise next()
export function redirectIfAuthenticated(req, res, next) {
    const token = req.cookies?.token; // ? to safely access cookies if cookies are undefined
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (!err) return res.redirect('/dashboard'); // if no error, redirect to dashboard
            next(); // else continue to the next middleware
        });
    } else {
        next(); // no token, continue to the next middleware
    }
}


// Some pages are accessible only to admin roles, that's why we need this middleware
export function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        console.log('Admin access granted');
        next();
    } else {
        console.log('Admin access denied');
        res.redirect('/dashboard'); // redirect to dashboard if not admin
    }
}