var express = require('express');
var router = express.Router();
var fs = require('fs')
var moment = require('moment')
const { parse } = require("csv-parse");
const { resourceLimits } = require('worker_threads');

const { Readable } = require("stream")

var nodeJsonDb = require('node-json-db')

var JsonDB = nodeJsonDb.JsonDB
var Config = nodeJsonDb.Config
var db = new JsonDB(new Config("localdb", true, false, '/'));

async function createDBImports() {
  try {
  
  var importPath = await db.exists("/imports");

  if(!importPath){
      await db.push("/imports", [{
          "id_importlog":"", 
          "env":"",
          "status":""
      }]);
  }

  } catch (err) {
      console.error(err);
  };
}


createDBImports()

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

//POST para registrar importação pendente.
router.post('/setImport', async function (req, res, next) {

  try{
  console.info('START SET Import Request', req.body)

  var body = req.body
  if(body["env"] && body["id_importlog"]){

    await db.push("/imports", [{
      "id_importlog":body["id_importlog"], 
      "env":body["env"],
      "status":"P" //Pending
  }],false);
    
  console.info('END SET Import Request - SUCCESS')
  res.status(200).send({'error':''})

  }else{
    res.status(400).send({'error':'Parametros de importação não recebidos!'});
    console.error('END SET Import Request - ERROR', {'error':'Parametros de importação não recebidos!'})
  }
}catch(err){
  res.status(500).send({'error':'Erro na requisição!' + err});
  console.error('END SET Import Request - ERROR', {'error':'Erro na requisição! ' + err})
}
});

router.get('/getImport', async function (req, res, next) {

    try{
       await db.getIndex('/imports','2','pk_import').then((data)=>{
          console.log('DATA',data)
        })

       await db.getIndexValue('/imports',0).then((data)=>{
          console.log('DATA INDEX VAL',data)
        })

        //Exemplo no NPM = await db.delete("/arraytest/myarray[" + await db.getIndex("/arraytest/myarray", 65464646155) + "]");
        await db.getData('/imports[1]').then((data)=>{
          console.log('DATA getData VAL',data)
        })

    }catch (err){
        res.status(500).send({error: 'Erro ao coletar configurações : ' + err});
    }

  res.status(200).send(req.params);
});

//Checa a cada 10 segundos importações pendentes
async function checkImports(){
  //Verifica as importações pendentes dentro de /imports
  await db.getData('/imports').then(async (data)=>{

    if(data.length > 0){
      var pendingImports = []

      //Filtra o array para retornar apenas registros pendentes e separa o index do DB no mesmo objeto
      pendingImports = data.filter(function(val,i){
        if(val["status"] == 'P'){
          val["dbindex"] = i
        }
        return val["status"] == 'P'
      } )

      console.log("CHECKING PENDING IMPORTS",pendingImports)

      if(pendingImports.length > 0){

        for(_import of pendingImports){
          prepareImport(_import)
        }
      }
    }
  })

  setTimeout(checkImports, 15000);
}

checkImports()

async function prepareImport(_import){

  var dbOmni = await getDBOmni(_import["env"])

  //-- Valicações se o dbOmni retornou --

  var knex = await connectKnex(dbOmni)

  //Caso a conexão aconteça sem problema, começa de fato a processar os arquivos.


  await startImport(_import,knex)

  
   /* setTimeout(function(){
      console.log("IMPORT SYNC",_import)
    },10000)*/

}

async function getDBOmni(env){

  //Ainda não temos a API por isso código de exemplo comentado

  /*https.get('https://dbmanager.plusoftomni.com.br/api/apod?api_key=KEY_ETC...', (resp) => {
    let data = '';

    // Um bloco de dados foi recebido.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // Toda a resposta foi recebida. Exibir o resultado.
    resp.on('end', () => {
      console.log(JSON.parse(data));
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });*/
  
  //Após a conexão retornar o response caso sucesso

  return ''
}

async function connectKnex(){
      //Com o retorno realiza a conexão no KNEX - Como não temos api apenas um código de exemplo:
  // var knex = await require('knex')({
  //   client: 'mssql',
  //   connection: {
  //     server: HOST,
  //     user: USER,
  //     password: PASS,
  //     database: DATABASE
  //   },
  //   acquireConnectionTimeout: 3600000
  // });

  // return knex
  return ''
}

async function startImport(_import){ //Segundo parametro removido, por enquanto
  try{
  db.push('/imports[' + _import['dbindex'] + ']', {
    "status": "R"
  }, false)

  //Recupera os dados da ImportLog baseado no que foi recebido no _import
  var importlog = null
  await knex.select('*').from('DATAIMP_IMPORTLOG').where('ID_IMPORTLOG','=',_import["id_importlog"]).first().then(async row => importlog = row)

  //Recupera os dados da tabela principal de importação pelo resultado da request anterior 
  var importto = null
  await knex.select('*').from('DATAIMP_IMPORT').where('ID_IMPORT','=',importlog["ID_IMPORT"]).first().then(async row => importto = row)

  //Recupera os dados de layout de importação pelo resultado da request anterior 
  var layout = null
  await knex.select('*').from('DATAIMP_LAYOUT').where('ID_LAYOUT','=',importto["ID_LAYOUT"]).first().then(async row => layout = row)

  //Recupera os campos dos layouts de importação pelo resultado da request anterior 
  var layoutfields = []  
  await knex.select('*').from('DATAIMP_LAYOUTFIELD').where('ID_LAYOUT','=',layout["ID_LAYOUT"]).orderBy('NR_SEQUENCE', 'asc').then(async row => layoutfields = row)
 
  var decimalseparator = layout["DO_DEFAULTDECIMALSEPARATOR"];
  var dateformat = layout["DS_DEFAULTDATEFORMAT"] ;
  var delimiter = layout["DO_DELIMITER"];
  var fieldqualification = layout["DO_FIELDQUALIFICATION"] == "D" ? "\"" : layout["DO_FIELDQUALIFICATION"] == "S" ? "'" : null; 
  var formatDateLayout = "";
  var countErro = 0;
  var divisor = 1000;

  var momentStart = moment(new Date())

  importlog["DT_START"] = moment().format('YYYY-MM-DD HH:mm:ss');

      if( dateformat ){
        dateformat = dateformat.toLowerCase().replaceAll("m", "M");
        formatDateLayout = dateformat 
      }

  var line = "";
  var lineNumber = 1;
  var fromLine = 1
  
  if (layout["DO_HASHEADER"] == "Y"){
    fromLine = 2
  }

  //recuperando a entidade OMNI
  var entityname = layout["DS_MAINOBJETOBD"]; 
  var entity = null
  await knex.select('*').from('OBJETOBD').where('DS_OBJETOBD','=',entityname).first().then(async row => entity = row)
  
  var pk = ''//daoFactory.getDao( entityname ).getEntity().getPrimaryKey().getName();
  var to = {};

  var columnInfo = {}

  await knex(entityname).columnInfo().then(async row => columnInfo = row)

  pk = Object.keys(columnInfo)[0]

  var sql = "";
  var filter = [];
  var ob = {};
  var campobd2 = {};

  await knex.select('*').from("CAMPOBD").where('id_objetobd','=',entity["ID_OBJETOBD"]).then(async row => {

    row.forEach(async (value)=>{
      campobd2[value["DS_CAMPOBD"]] = value
    })
  })

  await knex('DATAIMP_IMPORTLOG').where('ID_IMPORTLOG','=',_import["id_importlog"]).whereNull('DT_START').update( importlog )

  var canExecute = true;
  var errorLoop = 0;

  //Recupera o Arquivo relacionado com a importação - REQUEST DEMORADA!
  var arquivo = null

  await knex.select('*').from('DATAIMP_TEMPFILE').where('ID_COREFILE', '=', importlog["ID_FILE"]).whereNotNull('BL_DATA').first().then(async row => arquivo = row)

  //#####
  //Converte o Byte Array do banco em string e transforma em um readable
  //Usa o PIPE como Middleware e dentro do PIPE usa o PARSE do CSV-PARSE
  //Depois do PARSE retorna cada linha dentro do evento "data"

    const readable = Readable.from([arquivo.BL_DATA.toString()])
    readable.pipe(parse({ delimiter: delimiter, from_line: fromLine })).on("data", async (row) => {

      try{
      to = {};
      var analisyFields = [];
      var haveRecord = false;
      var primarykeyid = null;

      for(var i = 0; i < row.length; i++ ){
        var layoutfield = layoutfields[i]


        if( layoutfield["DS_CAMPOBD"] != null){  
          var campobd = campobd2[layoutfield["DS_CAMPOBD"]];
          var tpcampobd = {};
          tpcampobd["DS_TPCAMPOBD"] = campobd["DS_TPCAMPOBD"];
          layoutfields[i]["TPCAMPOBD"] = tpcampobd;
          layoutfields[i]["CAMPOBD"] = campobd;
        }

        layoutfields[i]["COLVALUE"] = row[i];


        var colvalue = layoutfield["COLVALUE"]; 


        if( layoutfield["DO_ACTION"] != "G"){
          if(
            ( haveRecord == true && layoutfield["DO_ACTION"] == "U") || ( haveRecord == false && ( layoutfield["DO_ACTION"] == "I" || layoutfield["DO_ACTION"] == "U") )
          ){

            var tpcampobd = layoutfield["TPCAMPOBD"];

            if( tpcampobd["DS_TPCAMPOBD"] == "Datetime" || tpcampobd["DS_TPCAMPOBD"] == "Date" ){

              if( colvalue != ""){

                var formatField =  layoutfield["DS_FORMAT"];
                if( formatField == "null"){  formatField = null;  }

                if( formatField != null){

                  formatField = formatField.toLowerCase();
                  formatField = formatField.replaceAll("m", "M");

                  colvalue = moment(colvalue).format(formatField);
                }
                else if( dateformat ){ 
                  colvalue = moment(colvalue).format(formatDateLayout)
                }  // end if formatField != null

              }// end if colvalue != ""

            }else if( tpcampobd["DS_TPCAMPOBD"] == "Numeric" ){

              colvalue = colvalue.replace( decimalseparator, ".");

            }

            //verificando se é somente números
            var onlynumbers = layoutfield["DO_ONLYNUMBERS"];

            if( onlynumbers == "null"){  onlynumbers = null;  }

            if( onlynumbers == "Y"){
              colvalue = colvalue.replaceAll("[^0-9]", "");
            }

            //tamanho do campo (Exception a parte)
            if( layoutfield["CAMPOBD"] && layoutfield["CAMPOBD"]["NR_TAMANHO"] != null && layoutfield["CAMPOBD"]["NR_TAMANHO"] > -1 ){ 
              // PO-4536 // if( layoutfield["campobd"]["nr_tamanho"] != null){
              if( colvalue.length > layoutfield["CAMPOBD"]["NR_TAMANHO"] ){
                //COMENTADO POR ENQUANTO - throwTruncatedException(i, colvalue, entityname, layoutfield["ds_campobd"] , layoutfield["campobd"]["nr_tamanho"] );  
              }
            }

            if( colvalue != ""){
              to[ layoutfield["DS_CAMPOBD"].toLowerCase()] = colvalue;
            }
          }
        }

        if( layoutfield["DO_ANALYSIS"] == "Y" ){
          if( layoutfields[i]["TPCAMPOBD"] != null){

            var colvalue = layoutfields[i]["COLVALUE"];
            var tpcampobd = layoutfields[i]["TPCAMPOBD"];

            if( layoutfield["DO_ONLYNUMBERS"] == "Y"){
              colvalue = colvalue.replaceAll("[^0-9]", "");
            }

            if( tpcampobd.ds_tpcampobd == "Integer" || tpcampobd.ds_tpcampobd == "Numeric" || tpcampobd.ds_tpcampobd == "Long" ){  
              colvalue = colvalue;          
          }else{  
            colvalue = colvalue;  
          }
          sql = "where";
          ob[layoutfield["DS_CAMPOBD"]] = colvalue;

          }

        }
      }

      if(sql != ""){
        
        var data = []

        var firstOb = ob[Object.keys(ob)[0]]
        var nameFirstOb = Object.keys(ob)[0]

        await knex.raw("SELECT TOP 1 "+pk+" AS VAL FROM "+entityname+" WHERE "+nameFirstOb+" = " + firstOb).then(async row => data.push(row))

        if( data.size > 0 ){  
          haveRecord = true;  
          primarykeyid = data[0].VAL;
        }  
      }

      // invoca o método onrecord
      //if( strategySource && strategySource.onrecord ){
      //  strategySource.onrecord( to, importto, lineNumber );
      //} VER COMO FAZER ISSO, TALVEZ NÃO SEJA POSSÍVEL

      // caso o registro já exista será atualizado, caso o contrário será efetuado um insert
      if( haveRecord ){ 

        //daoFactory.getDao( entityname ).filter( pk ).equalsTo( primarykeyid ).update( to );
        await knex(entityname).where(pk,"=",primarykeyid).update(to)

        to[ pk ] = primarykeyid;
        // atualiza o import log
        importlog["NR_DUPLICATED"] = importlog["NR_DUPLICATED"] + 1;
      }else{
        // insert

        //daoFactory.getDao( entityname ).insert( to );
        if(to){
          var pkId = ''

          await knex(entityname).insert(to).returning('*').then(async returning => {
            var return0 = returning[0]
            pkId = return0[pk]
          })
        }
      }

      importlog["NR_RECORDSSUCCESS"] = importlog["NR_RECORDSSUCCESS"] + 1;

      //importlog
      var importlogrecord = {}; 
      importlogrecord["ID_PKMAINTABLE"] = pkId;
      importlogrecord["ID_IMPORTLOG"] = importlog["ID_IMPORTLOG"];
      importlogrecord["NR_EXECUTEDLINE"] = lineNumber;

      if(importlogrecord){
        await knex('DATAIMP_IMPORTLOGRECORDKEY').insert(importlogrecord)
      }
      
      
      if(errorLoop != 0){
        errorLoop = 0;
      }
    }catch(e){
      
      var  importlogerror = {};
      var error = e.cause;
      if(e.message){
          if(e.cause && e.cause.message == "#notcount#"){
                error = e.message;
                console.info("Desconsiderar count Espec");
            }else{
                errorLoop++;
            }
      }

      importlogerror["ID_IMPORTLOG"] = importlog["ID_IMPORTLOG"];
      importlogerror["TX_ERROR"] = e.message||e.cause;  /* PO-4536 */
      importlogerror["TX_CAUSE"] = error;  /* PO-4536 */
      importlogerror["TX_ERRORLINE"] = line;
      importlogerror["NR_ERRORLINE"] = lineNumber;

      countErro++

      // invoca o método onerror [ caso exista ] 
      /*if( strategySource ){
        try{
          strategySource.onerror( importlogerror, importto );
        }
        catch(e){
          log.error("Erro o invocar o método onerror. estratégia: {} ", layout["ds_strategykey"], e );
        }
      }*/ //AJUSTAR ESSE CARA ^^^ TALVEZ NÃO SEJA POSSIVEL

      //daoFactory.getDao("DATAIMP_IMPORTLOGERROR").insert( importlogerror );

      if(importlogerror){
        await knex('DATAIMP_IMPORTLOGERROR').insert(importlogerror)
      }
      

      importlog["NR_RECORDSFAIL"] = importlog["NR_RECORDSFAIL"] + 1;

      console.error('Erro ao inserir linha: ',e)

    }finally{
      importlog["NR_RECORDSTOTAL"] = importlog["NR_RECORDSTOTAL"] + 1;

      //Código temporariamente dentro do "ON END"

      importlog["DT_END"] = moment().format('YYYY-MM-DD HH:mm:ss');

      var momentEnd =  moment(new Date())

      var elapsed = moment.utc(moment(new Date(),"YYYY-MM-DD HH:mm:ss").diff(moment(momentStart,"DD/MM/YYYY HH:mm:ss"))).format("HH:mm:ss")

      console.log("SECONDS",elapsed)

      importlog["NR_ELAPSED"] = elapsed;

      if(importlog["NR_RECORDSFAIL"] > 0){
        importlog["DO_FAIL"] = 'Y'
      }
      
      await knex("DATAIMP_IMPORTLOG").where("ID_IMPORTLOG","=",importlog["ID_IMPORTLOG"]).update(importlog)
    }

    lineNumber++;

    }).on("end", async () =>{

    })

  db.push('/imports[' + _import['dbindex'] + ']', {
    "status": "F"
  }, false)

  }
  catch(e){
    console.error("Erro no processo de importação", e );
      
    if (importlog){

        if (!importlog["DT_START"]) importlog["DT_START"] = moment().format('YYYY-MM-DD HH:mm:ss');

         importlog["DT_END"] = moment().format('YYYY-MM-DD HH:mm:ss');

         importlog["DO_FAIL"] = "Y";
      
        await knex("DATAIMP_IMPORTLOG").update(importlog)

          var  importlogerror = [];
          var error = e.cause;
          var msgError = "Erro antes de iniciar a leitura do arquivo.";
          importlogerror["ID_IMPORTLOG"] = importlog["ID_IMPORTLOG"];
          importlogerror["TX_ERROR"] = msgError + " " +  e.message||e.cause;

       if(importlog){
        await knex("DATAIMP_IMPORTLOGERROR").insert(importlog)
       }
        
    }

  }

}

module.exports = router;