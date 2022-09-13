var express = require('express');
var router = express.Router();
var fs = require('fs')
const { parse } = require("csv-parse");
const { resourceLimits } = require('worker_threads');

var knex = require('knex')({
  client: 'mssql',
  connection: {
    server: '10.193.16.11',
    user: 'USR_DV_DAVENEDEV',
    password: 'PW_DV_DAVENEDEV',
    database: 'DAVENEDEV_6GORWM'
  },
  acquireConnectionTimeout: 3600000
}); //CONECTA NO DB (DAVENE DEV)

/* GET home page. */
router.get('/setImport', function (req, res, next) {

  console.log('REQ.params', req.params)
  console.log('REQ.body', req.body)
  console.log('REQ.query', req.query)

  //res.status(200).send(req.params);
});

router.get('/testeImport', async function (req, res, next) {
  console.time('Tempo para Finalizar: ')
  fs.createReadStream("./100k.csv")
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", async function (row) {

      await knex('CST_CARGATEMP').insert({DS_DADOSTEMP: row[0]});

    }).on("end", function () {
      console.log("Finalizado.");
      console.timeEnd('Tempo para Finalizar: ')
    })
  res.render('index', { title: 'Express' });
});

var testeArray = []
var testeArray2 = []
var testeArray3 = []

router.get('/testeImport2', async function (req, res, next) {
  console.time('Tempo para Finalizar: ')
  fs.createReadStream("./100k_2.csv")
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", async function (row) {
      
      testeArray.push({
        DS_DADOSTEMP:row[0],
        DS_DADOSTEMP2:row[1]
      })

      if(testeArray.length == 20){
        //await knex('CST_CARGATEMP').insert(testeArray);
      }

    }).on("end", async function () {
      console.log("Finalizado.");
      console.timeEnd('Tempo para Finalizar: ')

      teste()
    })
  res.render('index', { title: 'Express' });
});

router.get('/testeImport3', async function (req, res, next) {
  console.time('Tempo para Finalizar: ')
  fs.createReadStream("./100k_2.csv")
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", async function (row) {
      
      testeArray2.push({
        DS_DADOSTEMP:row[0],
        DS_DADOSTEMP2:row[1]
      })

      if(testeArray.length == 20){
        //await knex('CST_CARGATEMP').insert(testeArray);
      }

    }).on("end", async function () {
      console.log("Finalizado.");
      console.timeEnd('Tempo para Finalizar: ')

      teste2()
    })
  res.render('index', { title: 'Express' });
});

router.get('/testeImport4', async function (req, res, next) {
  console.time('Tempo para Finalizar: ')
  fs.createReadStream("./100k_2.csv")
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", async function (row) {
      
      testeArray3.push({
        DS_DADOSTEMP:row[0],
        DS_DADOSTEMP2:row[1]
      })

      if(testeArray.length == 20){
        //await knex('CST_CARGATEMP').insert(testeArray);
      }

    }).on("end", async function () {
      console.log("Finalizado.");
      console.timeEnd('Tempo para Finalizar: ')

      teste3()
    })
  res.render('index', { title: 'Express' });
});

async function teste(){
  console.time('Tempo para Finalizar FOR: ')
  for(var i = 0; i < 100; i++){
    x = i * 1000

    if(i == 0) x = 1000

    var i2 = x - 1000
    var newArrayInsert = testeArray.slice(i2,x)
    console.log("newArrayInsert Length!.", newArrayInsert.length);

    await knex('CST_CARGATEMP').insert(newArrayInsert);
  }
  console.timeEnd('Tempo para Finalizar FOR: ')
}

async function teste2(){
  console.time('Tempo para Finalizar FOR: ')
  for(var i = 0; i < 100; i++){
    x = i * 1000

    if(i == 0) x = 1000

    var i2 = x - 1000
    var newArrayInsert = testeArray2.slice(i2,x)
    console.log("newArrayInsert Length!.", newArrayInsert.length);

    await knex('CST_CARGATEMP').insert(newArrayInsert);
  }
  console.timeEnd('Tempo para Finalizar FOR: ')
}

async function teste3(){
  console.time('Tempo para Finalizar FOR: ')
  for(var i = 0; i < 100; i++){
    x = i * 1000

    if(i == 0) x = 1000

    var i2 = x - 1000
    var newArrayInsert = testeArray3.slice(i2,x)
    console.log("newArrayInsert Length!.", newArrayInsert.length);

    await knex('CST_CARGATEMP').insert(newArrayInsert);
  }
  console.timeEnd('Tempo para Finalizar FOR: ')
}

module.exports = router;
