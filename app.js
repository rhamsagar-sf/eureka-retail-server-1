const express = require("express");
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const cors = require("cors");
const basicAuth = require("basic-auth");
var compare = require("tsscmp");
const jsforce = require("jsforce");

dotenv.config();

const { Client } = require("pg");

const app = express();

app.use(express.json()); // Used to parse JSON bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(cors());

// either set port from env provided by Heroku, or load 3000 for localhost
const PORT = process.env.PORT || 3000;

const client = new Client({
  // either take database url provided by heroku, or from .env file for localhost
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
 
});

// Basic function to validate credentials for example
function checkCredentials(name, pass) {
  var valid = true;

  // Simple method to prevent short-circut and use timing-safe compare
  valid = compare(name, "admin") && valid;
  valid = compare(pass, "eureka") && valid;

  return valid;
}

client.connect();

app.get("/", (req, res) => {
  res.send(
    "Hello World from Eureka! Use GET /customers or /customers/:userId or POST /customers for this API"
  );
  console.log(user);
});

/* get all customers from database */

app.get("/customers", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    client.query(
      "SELECT * FROM salesforce.eureka_customers_c__c;",
      (err, result) => {
        if (err) throw err;
        for (let row of result.rows) {
          console.log(JSON.stringify(row));
        }
        res.send(result.rows);
      }
    );
  }
});

/* get details of a specific customer */

app.get("/customers/:userId", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    const userId = req.params.userId;
    client.query(
      "SELECT * FROM salesforce.eureka_customers_c__c WHERE id = $1;",
      [userId],
      (err, result) => {
        if (err) throw err;
        for (let row of result.rows) {
          console.log(JSON.stringify(row));
        }
        res.send(result.rows);
      }
    );
  }
});

/* post method to add customers */

app.post("/customers", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    const { name, email, address, phone, joindate, membership, totalspent } =
      req.body;
    client.query(
      "INSERT into salesforce.eureka_customers_c__c (name_c__c, email_c__c, address_c__c, phone_c__c, membership_c__c, totalspent_c__c, joindate_c__c, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7, 'false');",
      [name, email, address, phone, membership, totalspent, joindate],
      (err, result) => {
        if (err) throw err;
        for (let row of result.rows) {
          console.log(JSON.stringify(row));
        }
        res.send(`New User ${name} added!`);
      }
    );
  }
});

/* post method to update customers */

app.put("/customers", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    const { id, name, email, address, phone } = req.body;
    client.query(
      "UPDATE salesforce.eureka_customers_c__c SET name_c__c = $2, email_c__c = $3, address_c__c = $4, phone_c__c = $5 WHERE id = $1;",
      [id, name, email, address, phone],
      (err, result) => {
        if (err) throw err;
        for (let row of result.rows) {
          console.log(JSON.stringify(row));
        }
        res.send(`User modified with ID: ${id}`);
      }
    );
  }
});

/* delete method to remove a customer from database */

app.delete("/customers/:userId", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    const { id } = req.body;
    client.query(
      "DELETE from salesforce.eureka_customers_c__c WHERE id = $1;",
      [id],
      (err, result) => {
        if (err) throw err;
        for (let row of result.rows) {
          console.log(JSON.stringify(row));
        }
        res.send(`User deleted with ID: ${id}`);
      }
    );
  }
});

// JSFORCE Demo

// Login Salesforce
const { SF_LOGIN_URL, SF_USERNAME, SF_PASSWORD, SF_TOKEN } = process.env;
const conn = new jsforce.Connection({
  loginURL: SF_LOGIN_URL,
});
conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, (err, userInfo) => {
  if (err) {
    console.error(err);
  } else {
    console.log("User ID" + userInfo.id);
    console.log("Org ID" + userInfo.organizationId);
  }
});

// get all return histories using JSForce
app.get("/returnhistories", (req, res) => {
  var credentials = basicAuth(req);
  if (!credentials || !checkCredentials(credentials.name, credentials.pass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.end("Access denied");
  } else {
    conn.query(
      //"SELECT Name, Item_SKU_c__c, Return_Reason_c__c, Returned_Date__c, Delivery_Status_c__c FROM Eureka_Returned_Item_c__c",
      "SELECT Name, Item_SKU_c__c, Return_Reason_c__c, Delivery_Status_c__c FROM Eureka_Returned_Item_c__c",
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        for (let row of result.records) {
          console.log(JSON.stringify(row));
        }
        res.send(JSON.stringify(result.records));
      }
    );
  }
});

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
