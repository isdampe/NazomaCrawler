//wp_blogs -> Get list WHERE public = 1
//foreach list as blogid
//SELECT * FROM wp_blogid_postmeta WHERE meta_key = 'amazon_image_url'
//foreach result
//HTTP request -> check for 404.

var mysql = require("mysql");
var http = require("http");
config = require("./config.js");
var wp = require("./wp.js");

var connection = mysql.createConnection({
  host: config.db.host,
  user: config.db.user,
  password: config.db.pass,
  database: config.db.db
});

blogPosts = {};

//Connect to MySQL.
connection.connect(function(err){
  if ( err ) { throw err; }
});

wp.getBlogList(connection, function(res){

  //Start scanner.
  wp.getUrls(connection,res);

});

setTimeout(function(){
  process.exit(0);
}, 1000 * 60 * 60);
