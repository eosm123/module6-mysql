const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const { createConnection } = require('mysql2/promise');

// Creating an express application
let app = express();

// Set hbs -> using hbs as a view engine
app.set('view engine', 'hbs');
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

app.use(express.static('public'));

// Setup form processing
app.use(express.urlencoded({extended:false}));



let connection;

async function main() {
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    app.get('/', (req,res) => {
        res.send('Hello, World!');
    });

    // Starting the server
    app.listen(3000, ()=>{
        console.log('Server is running')
    });
}

main();
