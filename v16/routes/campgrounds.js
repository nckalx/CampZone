var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'campzone', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - SHOW ALL CAMPGROUNDS

router.get("/", function(req, res){
    var noMatch = null;
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');    
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
        if(err){
           console.log(err);
        } else {
            if(allCampgrounds.length < 1){
                noMatch = "No campgrounds match that query, please try again.";
            } 
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: 'campgrounds', noMatch: noMatch}); 
       }
    });
    } else {
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: 'campgrounds', noMatch: noMatch}); 
       }
    });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if (err){
          req.flash("error", err.message);
          return res.redirect("back");
      }
  // get data from form and add to campgrounds array
  // add cloudinary url for the image to the campground object
  req.body.campground.image = result.secure_url;
  // add image's public_id to campground object
  req.body.campground.imageId = result.public_id;
  // add author to campground
  req.body.campground.author = {
      id: req.user._id,
      username: req.user.username
  };
  geocoder.geocode(req.body.location, function (err, data) {
    console.log(data);
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    // Create a new campground and save to DB
    Campground.create(req.body.campground, function(err, newlyCreated){
        if(err){
            req.flash("error", "Something went wrong.");
            return res.redirect("back");
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
  });
});

//NEW - SHOW FORM TO CREATE NEW CAMPGROUND

router.get("/new", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
       if(err){
           res.redirect("/campgrounds");
       } else {
           res.render("campgrounds/new", {campground: foundCampground});          
       }
    });
});


// SHOW - SHOWS MORE INFO ABOUT ONE CAMPGROUND

router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
       if(err || !foundCampground){
           req.flash("error", "Campground not found!");
           res.redirect("/campgrounds");
       } else {
           console.log(foundCampground);
         //render  show template with that campground 
         res.render("campgrounds/show", {campground: foundCampground}); 
       }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
   Campground.findById(req.params.id, function(err, foundCampground){
       if (err){
           res.redirect("back");
       } else {
           res.render("campgrounds/edit", {campground: foundCampground});
       }
   });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", upload.single("image"), middleware.checkCampgroundOwnership, async function(req, res){
  try {
  	// add author object to campground on req.body
	req.body.campground.author = {
	    id: req.user._id,
	    username: req.user.username
	};
	// check if file uploaded
  	if(req.file) {	
  	  await cloudinary.v2.uploader.destroy(campground.image.public_id);
  	  // upload file to cloudinary
	  let result = await cloudinary.v2.uploader.upload(req.file.path);
	  // assign to campground object
	  req.body.campground.image = result.secure_url;
	  req.body.campground.imageId = result.public_id;
  	}
  	  // geocode location
	  let data = await geocoder.geocode(req.body.campground.location);
	  // assign lat and lng and update location with formatted address
	  req.body.campground.lat = data[0].latitude;
	  req.body.campground.lng = data[0].longitude;
	  req.body.campground.location = data[0].formattedAddress;
	  // create campground from updated req.body.campground object
	  let campground = await Campground.create(req.body.campground);
	  // redirect to campground show page
	  res.redirect(`/campgrounds/${campground.id}`);
	} catch(err) {
	    // flash error and redirect to previous page
	    req.flash('error', err.message);
	    res.redirect('back');
	}
});


// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req,res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;