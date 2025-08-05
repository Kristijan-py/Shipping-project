const utcDate = new Date();
const localDate = utcDate.toLocaleString('en-GB', { timeZone: 'Europe/Skopje' });
console.log(localDate); // "03/08/2025, 12:31:02"
