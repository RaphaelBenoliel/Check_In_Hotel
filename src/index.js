import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set ,get,child} from 'firebase/database';
import nodemailer from 'nodemailer';

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBoDKauyiDVKCTMcu8w6fyinvvKlUjEzH4",
    authDomain: "smarthotel-a2786.firebaseapp.com",
    databaseURL: "https://smarthotel-a2786-default-rtdb.firebaseio.com",
    projectId: "smarthotel-a2786",
    storageBucket: "smarthotel-a2786.appspot.com",
    messagingSenderId: "886248898529",
    appId: "1:886248898529:web:5a2221dfaa98d86aca1ca0",
    measurementId: "G-NERLK9DN33"
};

// Initialize Firebase
const appd = initializeApp(firebaseConfig);
// Initialize Realtime Database and get a reference to the service
const database = getDatabase(appd);

// Set up middleware to parse form data
app.use(express.urlencoded({ extended: true }));
// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'shs.smarthotel@gmail.com',
      pass: 'cogr wqtj uipe ipwg', 
    },
  });
// Handle form submission
app.post('/check-in', async (req, res) => {
    const {
        'client-firstname': clientFirstName,
        'client-lastname': clientLastName,
        'client-email': clientEmail,
        'client-phone': clientPhone,
        'check-in-date': checkInDate,
        'check-out-date': checkOutDate,
        'card-number': cardNumber,
        'exp-month': expMonth,
        'exp-year': expYear,
        'cvc': cvc,
    } = req.body;
     // Validate inputs
     const errors = {};
     if (!isValidCardNumber(cardNumber)) {
         errors['card-number'] = 'Invalid card number. It must be a 16-digit number.';
     }
     if (!isValidExpirationDate(expMonth, expYear)) {
         errors['exp-month'] = 'Invalid expiration month.';
         errors['exp-year'] = 'Invalid expiration year.';
     }
     if (!isValidCVC(cvc)) {
         errors['cvc'] = 'Invalid CVC. It must be a 3 or 4-digit number.';
     }
     // Save data to Firebase Realtime Database
    const checkInsRef = ref(database, "check-ins");
    const emailExistsSnapshot = await get(checkInsRef);
    let emailExists = false;
    if (emailExistsSnapshot.exists()) {
        // Loop through each child and check if the email exists
        emailExistsSnapshot.forEach((childSnapshot) => {
            const childData = childSnapshot.val();
            if (childData.email === clientEmail) {
                emailExists = true;
            }
        });
    }
    if (emailExists) {
         errors['client-email'] = 'Email already exists. Cannot check in.';
    }
     if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    
    const newCheckInRef = push(checkInsRef);
    set(newCheckInRef, {
        firstname: clientFirstName,
        lastname: clientLastName,
        email: clientEmail,
        phone: clientPhone,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        cardNumber: cardNumber,
        expMonth: expMonth,
        expYear: expYear,
        cvc: cvc,
        otp: otp,
    });

  // Send email with success message and OTP
  const mailOptions = {
    from: 'shs.smarthotel@gmail.com', // replace with your Gmail address
    to: clientEmail,
    subject: 'Check-In Successful',
    html: `
      <p>Your check-in was successful!</p>
      <p>One-Time Password (OTP): <strong>${otp}</strong></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
    // Send success response
    res.status(200).json({ success: true, message: 'Check-in successful!' });
});

function isValidCardNumber(cardNumber) {
    // Validate card number (16 digits)
    return /^\d{16}$/.test(cardNumber);
}

function isValidExpirationDate(expMonth, expYear) {
    // Validate expiration date (MM and YYYY format)
    const currentYear = new Date().getFullYear();
    const isValidMonth = /^\d{1,2}$/.test(expMonth) && parseInt(expMonth, 10) >= 1 && parseInt(expMonth, 10) <= 12;
    const isValidYear = /^\d{4}$/.test(expYear) && parseInt(expYear, 10) >= currentYear;

    return isValidMonth && isValidYear;
}

function isValidCVC(cvc) {
    // Validate CVC (3 or 4 digits)
    return /^\d{3,4}$/.test(cvc);
}
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'checkin.html');
    const decodedPath = decodeURIComponent(filePath);
    res.sendFile(decodedPath);
});

app.get('/style.css', (req, res) => {
    const filePath = path.join(__dirname, 'style.css');
    const decodedPath = decodeURIComponent(filePath);
    res.sendFile(decodedPath);
});

app.listen(port, () => {
    console.log('Server is up and running on port', port);
});
