'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow  = require('../models/follow');
var Publication = require('../models/publication');

var jwt = require('../services/jwt');




//Registro
//Hector Haro H.
function saveUser(req, res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname && 
       params.nick && params.email && 
       params.password){

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.imagr = null;

       
        User.find({ $or:[
                            {email: user.email.toLowerCase()},
                            {nick: user.nick.toLowerCase()}
                        ]}).exec((err, users) =>{
                            if(err) return res.status(500).send({message:'Error en la peticion de usuarios'});
                        
                            if(users && users.length >= 1){
                                return res.status(200).send({message: 'El usuario ya existe'})
                            }else{
                                bcrypt.hash(params.password, null, null, (err, hash) => {
                                    user.password = hash;
                        
                                    user.save((err, userStored) => {
                                        if(err) return res.status(500).send({message:'Error al guardar el Usuario'});
                                        
                                        if(userStored){
                                            res.status(200).send({user: userStored});
                                        }else{
                                            res.status(404).send({message: 'No se ha registrado el usuario'});
                                        }
                                    });
                                });
                                user.password = params.password;
                        
                            }
                        });     
        //Cifra contraseña y guarda los datos
        //Hector Haro H.
       }else{
           res.status(200).send({
               message: 'Envia todos los campos necesarios!!'
           });
        }
}

//LogIn
//hector8.haro@gmail.com.
function loginUser(req, res){

    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) =>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    
                    if(params.gettoken){

                        //Generar Token
                        //Hector Haro H.
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{

                        //Devolver datos de usuario
                       //Hector Haro H.
                    user.password = undefined;
                    return res.status(200).send({user});
                    }
                    
                }else{
                   return res.status(404).send({message: 'El usuario no se ha podido identificar'});

                }
            });
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido identificar!!'});

        }
    });
}


//Conseguir datos de un usuario
//hector8.haro@gmail.com
function getUser(req, res){
    var userId = req.params.id;

    User.findById(userId, (err, user) =>{
        if(err) return res.status(500).send({message: 'Error em ña peticion'});

        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        followeThisUser(req.user.sub, userId).then((value) =>{
            return res.status(200).send({
                user,
                following : value.following,
                followed: value.followed
            });
        });

    });
}

async function followeThisUser(identity_user_id, user_id){

    var following = await Follow.findOne({"user": identity_user_id, "followed":user_id}).exec((err, follow) =>{
        if(err) return handleError(err);
        return follow;
    });

    var followed = await Follow.findOne({"user":user_id, "followed":identity_user_id}).exec((err, follow) =>{
        if(err) return handleError(err);
        return follow;
    });

    return {
        following: following, 
        followe: followed
    }

}

//Devolver listado de usuarios paginados
//hector8.haro@gmail.com
function getUsers(req, res){
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) =>{
        if(err) return res.status(500).send({message: 'Error em la peticion'});
   
        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

        followUsersIds(identity_user_id).then((value) =>{


            return res.status(200).send({
                users,
                users_followeing: value.following,
                users_follow_my: value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        });
        
    });
}

async function followUsersIds (user_id){
    var following = await Follow.find({user: user_id}).select({'_id':0,'__v':0, 'user':0}).exec((err, follows) =>{
        return follows;
    });

    var follower = await Follow.find({followed: user_id}).select({'_id':0,'__v':0, 'followed':0}).exec((err, follows) =>{
      return follows;
    });
    //Procesar following ids
    var following_clean = [];

        following.forEach((follow) => {
            following_clean.push(follow.followed);
        });
        //Procesar followed ids
        var followed_clean = [];

        followed.forEach((follow) => {
            followed_clean.push(follow.user);
        });
       
    return {
        followeing: following_clean,
        followed: followed_clean
    }
}

function getCounters(req, res){
    var UserID = req.user.sub;
    
        if(req.params.id){
            userId = req.para.id;
        }

    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });
}

async function getCountFollow(user_id){
    var following = await Follow.count({"user": user_id}).exec((err, count) =>{
        if(err) return handleError(err);
        return count;
    });

    var followed = await Follow.count({"followed": user_id}).exec((err, count) =>{
        if(err) return handleError(err);
        return count;
    });

    var followe = await Follow.count({"followe": user_id}).exec((err, count) =>{
        if(err) return handleError(err);
        return count;
    });

    return{
        following: following,
        followed: followed
    }
}

//Edicion de datos de usuario
//hector8.haro@gmail.com
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    //Borrar propiedad password
    //hector8.haro@gmail.com
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'});

    }
    User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) =>{
        if(err) return res.status(500).send({message: 'Error em la peticion'});

        if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});

        return res.status(200).send({user: userUpdated});
    });

}

//Subir archivos de imagen de usuario
//hector8.haro@gmail.com
function uploadImage(req, res){
    var userId = req.params.id; 

    
    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);
        var file_split = file_path.split('\\');

        var file_name = file_split[2];
        console.log(file_name);

        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(userId != req.user.sub){
            return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'});
           return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');

        }
        if(file_ext == 'png'|| file_ext == 'jpg'||file_ext == 'jpeg'||file_ext == 'gif' ){
            //Acutalizar documento de usuario logeado
            //hector8.haro@gmail.com
            User.findOneAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) => {
                if(err) return res.status(500).send({message: 'Error em la peticion'});

                if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});

                return res.status(200).send({user: userUpdated});
            });
        }else{
            return removeFilesOfUploads(res, file_path, 'Extension no valida');
            
            
        }


    }else{
        return res.status(200).send({message:'No se han subido imagenes'});
    }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) =>{
        return res.status(200).send({message: message});
    });
}

//Obtener imagen de usuario
//hector8.haro@gmail.com
function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file,(exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message:'No existe la imagen'});
        }
    })
}


module.exports ={
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}
