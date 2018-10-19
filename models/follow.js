'use strict'

var mongoose = require('mongoose');
var Scheme = mongoose.Schema;

var FollowScheme = Scheme({
    user: {type: Scheme.ObjectId, ref:'User'},
    followed: {type: Scheme.ObjectId, ref:'User'}
});

module.exports = mongoose.model('Follow', FollowScheme);