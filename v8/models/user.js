var mongoose = require("mongoose");
var passsportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

UserSchema.plugin(passsportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);