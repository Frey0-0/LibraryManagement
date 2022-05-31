const mysql = require('mysql');
module.exports = mysql.createConnection({
  host: "localhost",
  user: "frey",
  password: "olympics@2016",
  database: "server",
  port: 3306,
});
