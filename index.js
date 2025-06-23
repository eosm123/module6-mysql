const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
require('dotenv').config();
// const { createConnection } = require('mysql2/promise');

// use the version of mysql2 that supports promises -> await a promise (await/async) 
const mysql = require('mysql2/promise');

// Creating an express application
const app = express();

// Set hbs -> using hbs as a view engine
app.set('view engine', 'hbs');

// Wax on allows for the creation of layouts -> template inheritance
waxOn.on(hbs.handlebars);
waxOn.setLayoutPath('./views/layouts');

app.use(express.static('public'));

// To enable form processing
app.use(express.urlencoded({ extended: true })); // true allows forms to contain arrays and objects

async function main() {
    let connection = await mysql.createConnection({
        'host': process.env.DB_HOST,
        // host means server
        'user': process.env.DB_USER,
        // database user
        'database': process.env.DB_DATABASE,
        'password': process.env.DB_PASSWORD
    })

    app.get('/', (req, res) => {
        const luckyNumber = Math.floor(Math.random() * 1000 + 1)

        res.render('index', {
            'lucky': luckyNumber
        });
    });

    app.get('/customers', async function (req, res) {
        // connection.execute will return array
        // only index 0 contains rows data
        // other indexes contain meta data
        let [customers] = await connection.execute(`
            SELECT * FROM Customers JOIN Companies
                ON Customers.company_id = Companies.company_id;`);
        // in mysql2 just write the query directly
        // the code above is array destructuring -> assigning each of the elements in the array to a variable
        // above is the same as let results = await connection.execute('...')
        // let customers = results[0]
        res.render('customers/index', {
            customers: customers
        });
    })

    app.get('/customers/create', async function(req, res){
        const [companies] = await connection.execute(`SELECT company_id, name FROM Companies`)
        res.render('customers/create', {
            // pass the company rows into the hbs file
            companies: companies
        })
    })

    // need this for when u click on the submit form
    app.post('/customers/create', async function(req, res) {
        const {first_name, last_name, rating, company_id} = req.body;
        const sql = `INSERT INTO Customers (first_name, last_name, rating, company_id)
VALUES (?, ?, ?, ?);`
        const bindings = [first_name, last_name, rating, company_id]
        // prepare statements - defence against SQL injection
        await connection.execute(sql, bindings);
        // bindings will be treated as data
        console.log(req.body);
        res.redirect('/customers'); // tells browser to go to send a URL
    })

    app.get('/about-us', function (req, res) {
        res.render('about-us')
    })

    app.get('/contact-us', function (req, res) {
        res.render('contact-us')
    })


}

main();

// Starting the server
app.listen(3000, function () {
    console.log('Server is running')
});
