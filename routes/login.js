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

//Coleta as configurações do DB Local
router.post('/getLogin', async (req, res, next) => {
    try{
        db.getData('/login').then((data)=>{
            delete data.authtoken 
            res.send(data);
        })
    }catch (err){
        res.status(500).send({error: 'Erro ao coletar configurações : ' + err});
    }
});
module.exports = router;