//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



 mongoose.connect(process.env.MONGODB_URI,{
   useUnifiedTopology:true,
   useNewUrlParser:true,
   useCreateIndex:true,
   useFindAndModify:false});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const item4 = new Item({
  name: "My Name is Dishant Balotra"
});

const item5 = new Item({
  name: "This is My To Do List Application"
});

const item6 = new Item({
  name: 'Add "/your-list" at the end of url to get started.'
});

const startItems = [item4, item5, item6];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (!foundItems || foundItems.length===0) {
      Item.insertMany(startItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  if(customListName === "Today"){
    res.redirect("/");
  }
else{
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList ){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else if(foundList.items.length===0){
        List.updateOne({
          name: customListName},
          {items: defaultItems
        },function(err){});
        res.redirect("/" + customListName);
      } else{
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });


}
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = _.capitalize(req.body.list);
if(itemName!==""){
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

}else if(listName === "Today"){
  res.redirect("/");
}else{
  res.redirect("/"+listName);
}
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });

  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
