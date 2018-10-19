'use strict'

var moment = require('moment');
var moongosePaginate = require ('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

//Guardar mensajes
//hector8.haro@gmail.com
function SaveMessage (req, res){
    var params = req.body;

    if(!params.text || !params.receiver) return res.status(200).send({message: 'Envia los datos necesarios'});

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.create_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if(err) return res.status(500).send({message: 'ERROR EN LA PETICION'});
        if(!messageStored) return res.status(500).send({message: 'Error al enviar el mensaje'});
        return res.status(200).send({message: messageStored});
    });
}
//Obtener mensajes recibidos
//hector8.haro@gmail.com
function getReceivedMessages(req, res){
    var userId = req.user.sub;
    var page = 1;  
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({receiver: userId}).populate('emitter', 'name surname image nick_id').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message: 'ERROR EN LA PETICION'});
        if(!messages) return res.status(404).send({message: ' No hay mensajes'});
        return res.status(200).send({
            total: total,
            page: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}
//Obtener mensajes emitidos
//hector8.haro@gmail.com
function getEmmitMessages(req, res){
    var userId = req.user.sub;
    var page = 1;  
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({emitter: userId}).populate('emitter receiver', 'name surname image nick_id').paginate(page, itemsPerPage, (err, messages, total) =>{
        if(err) return res.status(500).send({message: 'ERROR EN LA PETICION'});
        if(!messages) return res.status(404).send({message: ' No hay mensajes'});
        return res.status(200).send({
            total: total,
            page: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

//Obtener mensajes sin leer
//hector8.haro@gmail.com
function getUnviewedMessages(req, res){
    var userId = req.user.sub;

    Message.count({receiver: userId, viewed:'false'}).exec((err, count) =>{
        if(err) return res.status(500).send({message:'Error en la peticion'});
        return res.status(200).send({
            'unviewed':count
        });
    });

}

//Marcar mensajes como leidos
//hector8.haro@gmail.com
function saveViewedMessages(req, res){
    var userId = req.user.sub;

    Message.update({receiver:userId, viewed:'false'},{viwed:'true'}, {"multi":true}, (err, messageUpdate) =>{
        if(err) return res.status(500).send({message:'Error en la peticion'});
        return res.status(200).send({message: messageUpdate});
    });
}

module.exports = {
    SaveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviewedMessages,
    saveViewedMessages
}