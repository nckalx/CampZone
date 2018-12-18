var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
// is user logged in?
    if(req.isAuthenticated()){
       Campground.findById(req.params.id, function(err, foundCampground){
       if(err || !foundCampground){
           req.flash("error", "Campground not found");
           res.redirect("back");
       } else {
           // does user own the campground?
           // Mongoose object - console.log(foundCampground.author.id);
           // string - console.log(req.user._id);
           if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
              next();  
           } else {
               req.flash("error", "You don't have permission to do that");
               res.redirect("/campgrounds/" + req.params.id);
           }
       }
    }); 
    } else {
        req.flash("error", "You don't have permission to do that");
        res.redirect("/campgrounds/" + req.params.id);
    }
}


middlewareObj.checkCommentOwnership = function(req, res, next) {
// is user logged in?
    if(req.isAuthenticated()){
       Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err || !foundComment){
           req.flash("error", "Comment not found");
           res.redirect("/campgrounds");
       } else {
           // does user own the comment?
           if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
              next();  
           } else {
               req.flash("error", "You don't have permission to do that");
               res.redirect("/campgrounds" + req.params.id);
           }
       }
    }); 
    } else {
        req.flash("error", "You need be logged in to do that");
        res.redirect("/campgrounds");
    }
}

middlewareObj.checkUserOwnership = function(req, res, next) {
// is user logged in?
      if(req.isAuthenticated()) {
        if(req.user._id.equals(req.params.id) || req.user.isAdmin) {
            next();
        } else {
            req.flash("error", "Access denied, this is not your profile.");
            res.redirect("/users/" + req.params.id);
        }
    } else {
        req.flash("error", "You are not logged in.");
        res.redirect("/login");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}


module.exports = middlewareObj;
