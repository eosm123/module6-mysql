const express = require('express');
const hbs = require('hbs');
const waxOn = require('wax-on');
require('dotenv').config();
// const { createConnection } = require('mysql2/promise');

// handlebars helpers setup
const helpers = require('handlebars-helpers');
helpers({
    'handlebars': hbs.handlebars
})

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

// To enable form processing -> this is V IMPT if u want express app to receive forms provided by web browser
// Without the below, when u console.log(req.body) -> get undefined 
// Older versions use body-parser
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

    // this is where u show all customers -> best place to put search engine
    app.get('/customers', async function (req, res) {
        // since it is a search string for the search engine
        // use req.query (submit form via get) instead of req.body (submit form via post)
        const {first_name, last_name, rating, company_id} = req.query;
        let basicQuery = `SELECT * FROM Customers JOIN Companies
                ON Customers.company_id = Companies.company_id WHERE 1`
                // WHERE 1 means its always true
        // take note that ur basic query shud not have ; at the back
        // if the user enter first_name in search engine, modify the basic query with a WHERE to search for it
        const bindings = [];
        if (first_name) {
            basicQuery += " AND first_name = ?";
            bindings.push(first_name);
        }

        if (last_name) {
            basicQuery += " AND last_name = ?";
            bindings.push(last_name);
        }

        if (rating) {
            basicQuery += " AND rating = ?";
            bindings.push(rating);
        }

        if (company_id) {
            basicQuery += " AND Customers.company_id = ?";
            bindings.push(company_id);
        }
        console.log(bindings)

        // connection.execute will return array
        // only index 0 contains rows data
        // other indexes contain meta data
        let [customers] = await connection.execute(basicQuery, bindings);
        // in mysql2 just write the query directly
        // the code above is array destructuring -> assigning each of the elements in the array to a variable
        // above is the same as let results = await connection.execute('...')
        // let customers = results[0]

        // search form shud be inside customers/index.hbs
        res.render('customers/index', {
            customers: customers,
            first_name, last_name, rating, company_id
            // parsing the values into the hbs file
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

    app.get('/customers/:id/update', async function(req, res) {
        const customerId = req.params.id;
        const [rows] = await connection.execute(`SELECT * FROM Customers WHERE customer_id = ?`, [customerId])
        const [companies] = await connection.execute(`SELECT * FROM Companies`)
        res.render('customers/update', {
            customer: rows[0],
            companies
            // companies will show up as in the options for the select
        });
    })

    app.post('/customers/:id/update', async function(req, res) {
        const customerId = req.params.id;
        const {first_name, last_name, rating, company_id} = req.body;
        await connection.execute(`
            UPDATE Customers SET first_name=?, last_name=?, rating=?, company_id=?
                WHERE customer_id=?;`, [first_name, last_name, rating, company_id, customerId]);
        res.redirect('/customers');
    })

    // dynamic web app only can have get and post (cannot use delete unlike restful api)
    // DWA also should ask if want to confirm delete, unlike restful api where the front-end will settle and ask if
    // the customer want to delete or not
    app.get('/customers/:id/delete', async function(req, res) {
        const customerId = req.params.id;
        // connection.execute will always return an array
        const [rows] = await connection.execute(`SELECT * FROM Customers WHERE customer_id = ?`, [customerId]);
        const customer = rows[0]
        res.render('customers/delete', {
            // render should always be relative URL so no / at the start
            customer
        })
    })

    app.post('/customers/:id/delete', async function(req, res) {
        try {
            // this is where u do the deletion
            const customerId = req.params.id;
            await connection.execute(`DELETE FROM Sales WHERE customer_id = ?`, [customerId]);
            await connection.execute(`DELETE FROM EmployeeCustomer WHERE customer_id = ?`, [customerId]);
            await connection.execute(`DELETE FROM Customers WHERE customer_id = ?;`, [customerId])
            res.redirect('/customers')
        } catch (e) {
            console.log(e);
            res.send("Unable to delete because of relationship. Press [BACK] and try again.")
        }

    })

    app.get('/about-us', function (req, res) {
        res.render('about-us')
    })

    app.get('/contact-us', function (req, res) {
        res.render('contact-us')
    })

    // Read/Display all employees
    app.get('/employees', async function (req, res) {
        const [employees] = await connection.query(`
            SELECT first_name, last_name, Departments.name AS "department_name" FROM Employees JOIN Departments
                ON Employees.department_id = Departments.department_id;`)
        // render the template and the latter is for employees to go into the template
        res.render('employees/index', {
            'employees': employees
            // employees
            // above also work cos the key and value are the same name
        });
    })

    app.get('/employees/create', async function(req,res) {
        const [departments] = await connection.execute(`SELECT * FROM Departments`)
        res.render('employees/create', {
            departments
        })
    }) 

    app.post('/employees/create', async function(req, res) {
        // res.send("Form received");
        try {
            const bindings = [req.body.first_name, req.body.last_name, req.body.department_id];
            await connection.execute(`
                INSERT INTO Employees (first_name, last_name, department_id)
                    VALUES (?, ?, ?);`, bindings)
                    // cannot use ${req.body.first_name, ...} in the VALUES () as it is prone to SQL injection
                    // above is prepared statement that helps to combat SQL injection
        } catch (e) {
            console.log(e)
        } finally {
            res.redirect('/employees');
            // finally always executes, while try and catch is either or
        }


    })



}

main();

// Starting the server
app.listen(3000, function () {
    console.log('Server is running')
});
