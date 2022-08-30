import express from 'express';
import sql from 'mssql';
import knex from 'knex';

const app = express()
const port = 3000

app.post('/', (req, res) => {
    
  var config = {
    user: 'USR_DV_DAVENEDEV',
    password: 'PW_DV_DAVENEDEV',
    server: '10.193.16.11', 
    database: 'DAVENEDEV_6GORWM',
    options: {
      trustServerCertificate: true
      }
};

    // connect to your database
    sql.connect(config, function (err) {
    
      if (err) console.log(err);

      // create Request object
      var request = new sql.Request();
      var builder = new knex();
      
      
      // query to the database and get the records
      //'select top 100 * from crm_person (nolock)'
      request.query(builder.select('*').from('CRM_PERSON'), function (err, recordset) {
          
          if (err) console.log(err)
      
          console.log(recordset)

          // send records as a response
          res.send(recordset);
          
      });
  });

//    console.log("req.params",req.params)
//    console.log("req.headers",req.headers)
    // FAZ UM BILHAO DE COISAS E RETORNA

//  res.json({"oi":"oi"})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
