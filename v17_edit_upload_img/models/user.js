var mongoose = require("mongoose");
var passsportLocalMongoose = require("passport-local-mongoose");
var Campground = require('./campground');
var Comment = require('./comment');

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    description: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false}
});

// pre-hook middleware to delete all user's posts and comments from db when user is deleted
UserSchema.pre('remove', async function(next) {
  try {
      await Campground.remove({ 'author.id': this._id });
      await Comment.remove({ 'author.id': this._id });
      next();
  } catch (err) {
      console.log(err);
  }
});

UserSchema.plugin(passsportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);