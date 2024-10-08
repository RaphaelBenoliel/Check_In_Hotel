import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, child } from 'firebase/database';
import nodemailer from 'nodemailer';

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoDKauyiDVKCTMcu8w6fyinvvKlUjEzH4",
  authDomain: "smarthotel-a2786.firebaseapp.com",
  databaseURL: "https://smarthotel-a2786-default-rtdb.firebaseio.com",
  projectId: "smarthotel-a2786",
  storageBucket: "smarthotel-a2786.appspot.com",
  messagingSenderId: "886248898529",
  appId: "1:886248898529:web:5a2221dfaa98d86aca1ca0",
  measurementId: "G-NERLK9DN33",
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
    'check-in-date': checkInDateStr,
    'check-out-date': checkOutDateStr,
    'card-number': cardNumberWithSpaces,
    'exp-month': expMonth,
    'exp-year': expYear,
    'cvc': cvc,
  } = req.body;

  // Convert check-in and check-out dates to Date objects
  const checkInDate = new Date(checkInDateStr);
  const checkOutDate = new Date(checkOutDateStr);
  const cardNumber = cardNumberWithSpaces.replace(/\s/g, '');

  // Validate inputs
  const errors = {};

  if (!isValidName(clientFirstName)) {
      errors['client-firstname'] = 'First name must contain only letters.';
  }
  if (!isValidName(clientLastName)) {
      errors['client-lastname'] = 'Last name must contain only letters.';
  }
  if (!isValidEmail(clientEmail)) {
      errors['client-email'] = 'Invalid email format.';
  }
  if (!isValidPhoneNumber(clientPhone)) {
      errors['client-phone'] = 'Phone number must contain only digits and be at most 10 digits long.';
  }
  if (!isValidDate(checkInDate, checkOutDate)) {
      errors['check-in-date'] = 'Invalid check-in date. It must be a future date.';
      errors['check-out-date'] = 'Invalid check-out date. It must be after the check-in date.';
  }
  console.log(cardNumber);
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

  // Check if email already exists in the database
  const checkInsRef = ref(database, "guests");
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
    checkIn: checkInDateStr,
    checkOut: checkOutDateStr,
    cardNumber: cardNumber,
    expMonth: expMonth,
    expYear: expYear,
    cvc: cvc,
    otp: otp,
  });

  // Send email with success message and OTP
  const mailOptions = {
    from: 'shs.smarthotel@gmail.com',
    to: clientEmail,
    subject: 'SHS Smart Hotel - Check-In Successful',
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to SHS Smart Hotel!</h2>
        <p>Dear ${clientFirstName} ${clientLastName},</p>
        <p>We are pleased to inform you that your check-in was successful. We are delighted to have you with us and look forward to providing you with an exceptional stay.</p>
        <p>For your convenience, here is your One-Time Password (OTP):</p>
        <p style="font-size: 24px; font-weight: bold; color: #FF5722; text-align: center;">${otp}</p>
        <p>This OTP is important for accessing various services during your stay. Please keep it secure.</p>
        <p>If you need any assistance, feel free to reach out to our front desk or contact our support team at any time.</p>
        <p>Enjoy your stay!</p>
        <p>Best regards,</p>
        <p style="font-weight: bold;">The SHS Smart Hotel Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message. Please do not reply to this email.</a>.
        </p>
    </div>`,
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

// Validation functions
function isValidName(name) {
    // Validate name (only letters, no special characters or numbers)
    return /^[A-Za-z]+$/.test(name);
}

function isValidEmail(email) {
    // Validate email format (simple regex for common email formats)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phone) {
    // Validate phone number (only digits, maximum 10 digits)
    return /^\d{1,10}$/.test(phone);
}
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

function isValidDate(checkInDate, checkOutDate) {
  // Get the current date and set the time to midnight
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Ensure the check-in and check-out dates are valid Date objects
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return false;
  }

  // Set the time for check-in and check-out dates to midnight
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);

  // Check if the current date is less than or equal to the check-in date
  // and if the check-in date is less than the check-out date
  return currentDate <= checkInDate && checkInDate < checkOutDate;
}

// Add this function after the other validation functions
function formatCreditCardNumber(input) {
  // Remove any existing spaces
  let value = input.value.replace(/\s+/g, '');
  // Add a space after every 4 digits
  value = value.replace(/(\d{4})/g, '$1 ').trim();
  // Update the input value
  input.value = value;
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
