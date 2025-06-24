SELECT * FROM Customers JOIN Companies
ON Customers.company_id = Companies.company_id;

INSERT INTO Customers (first_name, last_name, rating, company_id)
VALUES ("Tony", "Stare", 3, 1);

SELECT * FROM Employees JOIN Departments
ON Employees.department_id = Departments.department_id;

-- dont need to care about employee_id as it is auto_increment
INSERT INTO Employees (first_name, last_name, department_id)
VALUES ("Andy", "Lau", 2);