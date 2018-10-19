'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;


//Conexion DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/MEAN_social', {useNewUrlParser: true})
        .then(() => {
            console.log("La conexion se hizo bien");
            
            //Crear Servidor
            app.listen(port, () => {
                console.log("Servidor corriendo en http://localhost:300");
            });
        })
        .catch(err => console.log(err));

        