import express from 'express';
const router = express.Router();
import multer from 'multer'; // for file uploads
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { uploadRateLimit } from '../middleware/rateLimit.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateOrderInfo } from '../services/validation.js';
import { createOrder } from '../repository/orderRepository.js';
import { duplicateOrderCheck } from '../services/validation.js';

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// Multer setup
const upload = multer({
    dest: '../uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
    message: {
        fileSize: 'File is too large'
    },
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
        const parser = parse({columns: true, trim: true, skip_empty_lines: true});
        const readStream = fs.createReadStream(req.file.path).pipe(parser);
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
                    console.error(`Row ${currentRow} creating error: `, error.message);
                    stats.errors.push({ rowNumber: currentRow, error: "Internal server error" });
                }
            })()); // () between --> invoking the async function

        });
        
        readStream.on('end', async () => {
            await Promise.all(promises);
            // deleting the file
            fs.unlink(req.file.path, (err) => {
                if (err){
                    console.error('Error deleting file: ', err.message);
                }
            })

            res.status(200).send(stats);
        });

        readStream.on('error', (error) => {
            console.error('Error reading CSV file: ', error.message);
            res.status(500).send({ error: "Error reading CSV file" });
        });

    } catch (error) {
        console.error('Error uploading the order: ', error.message);
        res.sendStatus(500);
    }
});






export default router;