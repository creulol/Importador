var express = require('express');
var router = express.Router();

var nodeJsonDb = require('node-json-db')

var JsonDB = nodeJsonDb.JsonDB
var Config = nodeJsonDb.Config

//Primeiro argumento = Nome do arquivo .json
//Segundo argumento = Save automático, senão chamar método save()
//Terceiro argumento = Salvar em formato de leitura humano, padrão: false
//Quarto argumento = Separador, por padrão '/'
var db = new JsonDB(new Config("localdb", true, false, '/'));

async function createDB() {
    try {
    
    var configPath = await db.exists("/config");

    if(!configPath){
        await db.push("/config", {
            "baseurl":"", 
            "endpoint":"",
            "authtoken":""
        });
    }

    } catch (err) {
        console.error(err);
    };
}

createDB()

//Coleta as configurações do DB Local
router.get('/getConfig', async (req, res, next) => {
    try{
        db.getData('/config').then((data)=>{
            delete data.authtoken 
            res.send(data);
        })
    }catch (err){
        res.status(500).send({error: 'Erro ao coletar configurações : ' + err});
    }
});

//Insere as informações de config no DB Local
router.post('/setConfig', function(req, res, next) {
    try{
        var body = req.body

        if(body.baseurl && body.endpoint){
            db.push("/config", {
                "baseurl":body.baseurl,
                "endpoint":body.endpoint
            },false);
        }

        if(body.authtoken){
            db.push("/config", {
                "authtoken":body.authtoken
            },false);
        }

        res.status(200).send({success: 'Informações salvas com sucesso!'})
    }catch(err){
        res.status(500).send({error: 'Erro ao salvar configurações : ' + err});
    }
});

module.exports = router;
