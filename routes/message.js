'use strict'

var express = require('express');
var MesageController = require('../controllers/message');
var api = express.Router();
var md_auth = require('../middelwares/authenticated');

api.post('/message', md_auth.ensureAuth, MesageController.SaveMessage);
api.get('/my-message/:page?', md_auth.ensureAuth, MesageController.getReceivedMessages);
api.get('/messages/:page?', md_auth.ensureAuth, MesageController.getEmmitMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, MesageController.getUnviewedMessages);
api.get('/set-viewed-messages', md_auth.ensureAuth, MesageController.saveViewedMessages);


module.exports = api;