

//VALIDATION FOR LETTER ONLY INPUTS
export function isOnlyLetters(str){
    str = str.trim();

    return /^[a-zA-z]+ *$/.test(str);
}

// VALIDATION FOR PASSWORD
export function validatePassword(password){
    const passwordMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[-!@#$+_%^&*(),.?":{}|<>]/.test(password);

    if (!passwordMinLength) return 'Password must have at least 8 characters.';
    if (!hasUppercase) return 'Password must have at least one uppercase letter.';
    if (!hasNumber) return 'Password must have at least one number.';
    if (!hasSymbol) return 'Password must have at least one symbol.';

    return true; // if everything passes, return true
}

// VALIDATION FOR PHONE NUMBER
export function validatePhoneNumber(phoneNumber){
    const phoneRegex = /^0\d{2}\s?\d{3}\s?\d{3}$/; // phone regex for Macedonia
    if(!phoneRegex.test(phoneNumber)){
        return 'Your number must start with 0 and contain 9 digits';
    } 
    return true;
}


// VALIDATION FOR EMAIL
export function validateEmail(email) {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    
    if (!emailRegex.test(email)) {
        return 'Invalid email format. Example: user@gmail.com';
    }
    
    return true;
}

// Check email, phone and pass
export function validateUserInput({name, phone, email, password, confirm_password}) {
    //Check name
    if(!isOnlyLetters(name)){
        return "Name must have only letters and no space";
    }
    if(name.length < 3) {
        return "Name must be at least 3 characters long";
    }


    if(!validateEmail(email)) {
        return 'Invalid email format. Example: user@gmail.com';
    }

    // Check phone number
    const validationPhone = validatePhoneNumber(phone);
    if(validationPhone !== true) {
        return validationPhone;
    }

    // Check password
    const passValidation = validatePassword(password);
    if(passValidation !== true) {
        return passValidation;
    }

    const confirmPassValidation = validatePassword(confirm_password);
    if(confirmPassValidation !== true) {
        return confirmPassValidation;
    }
    // Compare passwords
    if(password !== confirm_password) {
        return "Passwords do not match !";
    }

    return true;
}









// ORDERS VALIDATION
export function validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price) {
    const letterFields = [
        {value: sender_name, field: 'Sender Name'},
        {value: buyer_name, field: 'Buyer Name'},
        {value: buyer_city, field: 'Buyer City'},
        {value: buyer_village, field: 'Buyer Village'}
    ];

    for(const {value, field} of letterFields){
        if(value && !isOnlyLetters(value)){ // ? is for safe checking if values is empty or not
            return { valid: false , error: `${field} must contain only letters`}
        }
        if(value && value.length < 3) {
            return { valid: false , error: `${field} must be at least 3 characters long ❌`}
        }
    }

    // COMPARE PHONES
    if(sender_phone === buyer_phone && sender_phone !== '' && buyer_phone !== ''){
        return { valid: false , error: `Cannot have same phone numbers for sender and buyer`}
    }


    // PHONES
    if(sender_phone !== ''){
        const validationSenderPhone = validatePhoneNumber(sender_phone);
        if(validationSenderPhone !== true) {
            return { valid: false , error: validationSenderPhone}
        }
    }
    if(buyer_phone !== ''){
        const validationBuyerPhone = validatePhoneNumber(buyer_phone);
        if(validationBuyerPhone !== true) {
            return { valid: false , error: validationBuyerPhone}
        }
    }
    // PRICE
    if(price < 0 || isNaN(price)){
        return { valid: false , error: 'price under 0 or not contain only numbers'}
    }

    return {valid: true};
};


export function validateOrderInfoArray(fieldsToUpdate) {
    const { sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price } = fieldsToUpdate;

    return validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price);
    
};

