import express from 'express';
const router = express.Router();
import multer from 'multer'; // for file uploads
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { uploadRateLimit } from '../middleware/rateLimit.js';
import { authenticateToken } from '../middleware/JWT-Error-Logger-Roles.js';
import { validateOrderInfo } from '../src/helperFunctions.js';
import { createOrder, duplicateOrderCheck } from '../src/database.js';

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// Multer setup
const upload = multer({
    dest: '../uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
    fileFilter: (req, file, cb) => { // Only CSV allowed
        const allowedFiles = ['.csv', '.CSV'];
        const ext = path.extname(file.originalname).toLowerCase();
        if(!allowedFiles.includes(ext)) {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
});


// @POST Upload order from Excel
router.post('/uploadCsvFile', upload.single('csvFile'), authenticateToken, uploadRateLimit, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({error: "No file uploaded"});
        }
        const stats = { created: 0, errors: [] };
        let rowNumber = 0; // For easier error tracking

        // Read the file
        const filePromises = [req.file].map(file => {
            return new Promise((resolve, reject) => {
                const parser = parse({columns: true, trim: true, skip_empty_lines: true});
                const readStream = fs.createReadStream(file.path).pipe(parser);
                const promises = [];
    
                readStream.on('data', (row) => { // synchronous
                    rowNumber++;
                    const currentRow = rowNumber;
                    promises.push((async () => {
                        
                        const { sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying } = row;
                        
        
                        // Validate the order
                        const validateInput = validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price);
                        if (validateInput.valid !== true) {
                            stats.errors.push({ rowNumber: currentRow, error: validateInput.error });
                            return;
                        }
        
                        // Validate the duplicate order
                        const existingOrder = await duplicateOrderCheck(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price, package_type, whos_paying);
                        if (existingOrder) {
                            stats.errors.push({ rowNumber: currentRow, error: "Duplicate order found" });
                            return;
                        }
        
                        // Create the order
                        try {
                            await createOrder(req.user.id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying);
                            stats.created++;
                        } catch (error) {
                            console.error('Error creating order: ', error.message);
                            stats.errors.push({ rowNumber: currentRow, error: "Internal server error" });
                        }
                    })()); // () between --> invoking the async function
        
                });
                
                readStream.on('end', async () => {
                    await Promise.all(promises);
                    resolve();
                });

                readStream.on('error', (error) => {
                    reject(error);
                })

            });

        });
        await Promise.all(filePromises);
        res.send({ stats });

    } catch (error) {
        console.error('Error uploading the order: ', error.message);
        res.sendStatus(500);
    }
});






export default router;