import pool from "../config/database.js"; 


// FOR ORDERS
export async function paginateResults(req, res, next){
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const offset = (page - 1) * limit;

    const [data] = await pool.query('SELECT * FROM orders WHERE user_id =? LIMIT ? OFFSET ?', [req.user.id, limit, offset])

    // Count the pages to display prev/next
    const [totalPageData] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [req.user.id])
    
    const totalPages = Math.ceil(totalPageData[0].total / limit); // To avoid decimal


    req.pagination = {
        results: data,
        totalPages: totalPages,
        currentPage: page,
        pageLimit: limit
    };

    next();
}