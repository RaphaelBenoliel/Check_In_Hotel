import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set } from 'firebase/database';

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

// Handle form submission
app.post('/check-in', (req, res) => {
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

    // Save data to Firebase Realtime Database
    const checkInsRef = ref(database, "check-ins");
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
    });

    res.send("Check-in successful!");
});

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'checkin.html');
    const decodedPath = decodeURIComponent(filePath);
    console.log('File Path:', decodedPath);
    res.sendFile(decodedPath);
});

app.get('/style.css', (req, res) => {
    const filePath = path.join(__dirname, 'style.css');
    const decodedPath = decodeURIComponent(filePath);
    console.log('File Path:', decodedPath);
    res.sendFile(decodedPath);
});

app.listen(port, () => {
    console.log('Server is up and running on port', port);
});
