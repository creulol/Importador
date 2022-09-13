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
  
  var usersPath = await db.exists("/users");

  if(!usersPath){
      await db.push("/users", [{
          "name":"", 
          "user":"",
          "pass":""
      }]);
  }

  } catch (err) {
      console.error(err);
  };
}

createDB()

//Coleta as configurações do DB Local
router.post('/getLogin',  async (req, res, next) => {
    try{

        var exists = ''

        await db.getData('/users').then((data)=>{
          var body = req.body
         exists =  data.filter((value) => {
            if(value.user == body.login && value.pass == body.pass){
              return value
            }
          })
        })
        
        if(exists && exists.length > 0){
          res.status(200).send({success: 'success', name: exists[0].name});
        }else{
          res.status(400).send({error: 'Usuário não encontrado !'});
        }
    }catch (err){
        res.status(500).send({error: 'Erro ao coletar usuários : ' + err});
    }
});
module.exports = router;