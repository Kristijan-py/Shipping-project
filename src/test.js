// https://jsonplaceholder.typicode.com/users for testing users

import axios from 'axios';
import fs from 'fs';

async function fetchGmailUsers() {
    try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/users');

        const gmailUsers = response.data.filter(user => user.email.endsWith('@melissa.tv'));
        const formattedUsers = gmailUsers.map(user => {
            return {
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
        if(formattedUsers.length === 0) {
            console.log("No users found with that email domain.");
            return;
        }

        if(fs.existsSync('gmailUsers.json')) {
            fs.unlinkSync('gmailUsers.json'); // delete the file if it exists
        }
            fs.writeFileSync('gmailUsers.json', JSON.stringify(formattedUsers, null, 2));
            return;
    } catch (error) {
        console.error('Error fetching users:', error.message);
        throw new Error('Failed to fetch users');
    }
}

fetchGmailUsers();