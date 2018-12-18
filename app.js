var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose");
    
mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

//SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String
});

var Campground = mongoose.model("Campground", campgroundSchema);

/*Campground.create(
    {
       name: "Granite Hill",
       image: "https://cdn.pixabay.com/photo/2017/08/04/20/04/camping-2581242_960_720.jpg",
       description: "This is a huge granite hill, no bathrooms. No water. Beautiful granite!"
   },
   function(err, campground){
       if(err){
           console.log(err);
       } else {
           console.log("NEWLY CREATED CAMPGROUND: ");
           console.log(campground);
       }
   }
);*/


app.get("/", function(req, res){
   res.render("landing"); 
});


//INDEX - SHOW ALL CAMPGROUNDS

app.get("/campgrounds", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
            res.render("index", {campgrounds:allCampgrounds}); 
       }
    });

});

//CREATE - ADD NEW CAMPGROUND TO DATABASE

app.post("/campgrounds", function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCampground = {name: name, image: image, description: desc};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if (err){
            console.log(err);
        } else {
            // redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

//NEW - SHOW FORM TO CREATE NEW CAMPGROUND

app.get("/campgrounds/new", function(req, res) {
    res.render("new.ejs");
});


// SHOW - SHOWS MORE INFO ABOUT ONE CAMPGROUND

app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id, function(err, foundCampground){
       if(err){
           console.log(err);
       } else {
         //render  show template with that campground 
         res.render("show", {campground: foundCampground}); 
       }
    })
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The YelpCamp Server has started!");
});