import express from "express";
import  jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/helperFunctions.js";
import dotenv from 'dotenv';
dotenv.config();

// Authenticate token
export function authenticateToken(req, res, next) {
    // Check for tokens in cookies
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken) {
        if(!refreshToken) {
            return res.redirect('/login'); // No tokens
        }
        return authenticateRefreshToken(req, res, next); // maybe arefresh token is still valid if access token is expired or missing
    } 

    // Verify the token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            if(!refreshToken) {
                res.clearCookie('accessToken'); // clear cookies because expired
                res.clearCookie('refreshToken');
                return res.redirect('/login'); // expired
            }
            return authenticateRefreshToken(req, res, next);
        } 
        req.user = user;
        next();
    });
}

export async function authenticateRefreshToken(req, res, next) {
    const refreshToken = req.cookies?.refreshToken;
    if(!refreshToken) return res.redirect('/login'); // No token

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => { // we use decoded cause already we have set it up jwt sign
        if (err) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.redirect('/login'); // Expired or invalid token
        }
        // Creating new access token
        const { exp, iat, ...payload} = decoded // destructure to use only what we need
        const accessToken = await generateAccessToken(payload);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,       // true in production with HTTPS
            sameSite: 'lax',  // With lax I can use it on redirects
            maxAge: 15 * 60 * 1000       // 15 minutes
        });

        req.user = payload; // Attach user info to req
        next();
    });
}

// Redirect to dashboard if authenticated, otherwise next()
export function redirectIfAuthenticated(req, res, next) {
    const accessToken = req.cookies?.accessToken; // "?" -- to safely access cookies if cookies are undefined
    const refreshToken = req.cookies?.refreshToken;

    if(!accessToken && !refreshToken) return next(); // block dashboard page and redirect to homepage

    if (accessToken) {
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (!err) return res.redirect('/dashboard'); // if no error, redirect to dashboard
            if(refreshToken) return res.redirect('/dashboard'); // if accessToken is expired and refreshToken is not
            next(); // else continue to the next middleware
        });
    } else if(refreshToken) {
        return res.redirect('/dashboard');
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