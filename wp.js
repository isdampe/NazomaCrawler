var printf = require('util').format;
var http = require("http");
var jsdom = require("jsdom");
var request = require("request");
var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport("SMTP",{
    host: config.warn.server,
    port: config.warn.port,
    auth: {
        user: config.warn.user,
        pass: config.warn.pass
    }
});

exports.getBlogList = function(connection, callback) {

  var query, result;

  query = printf("SELECT blog_id, domain blog_ FROM wp_blogs WHERE public = '1'");
  connection.query(query, function(err, rows,field){
    if (err) throw err;

    callback(rows);

  });

};

exports.getUrls = function(connection, res) {

  var key, resultsBuffer = [], blog_id, objBuffer;

  for ( key in res ) {
    if( res[key].hasOwnProperty("blog_id") ) {

      blog_id = res[key].blog_id;
      objBuffer = {
        blog_id: blog_id,
        domain: res[key].blog_,
        status: 0,
        data: {}
      };
      blogPosts[blog_id] = objBuffer;

      this.getFieldsFromBlog(connection,blog_id);

    }
  }

};

exports.getFieldsFromBlog = function(connection,blog_id) {

  var query, result, wp = this, key;

  query = printf("SELECT * FROM %s WHERE meta_key = 'amazon_image_url' LIMIT 0,999999", 'wp_' + blog_id + "_postmeta" );

  connection.query(query, function(err, rows, field){
    if (err) throw err;

    blogPosts[blog_id].status = 1;

    for ( key in rows ) {
      blogPosts[blog_id].data[key] = rows[key];
      wp.checkAmazonProducts(connection,blog_id, key);
    }

  });

};

exports.checkAmazonProducts = function(connection, blog_id, key) {

  var url, req, imgAr, key, options, wp = this, warnObj;

  //Extract url.
  //url = blogPosts[blog_id].data.meta_value;
  jsdom.env(
    blogPosts[blog_id].data[key].meta_value,
    function (errors, window) {
      if (errors) { throw errors; }
      imgAr = window.document.querySelectorAll("img");
      if ( typeof imgAr[0].src !== 'undefined' ) {
        //Let's make a HTTP request.
        req = request({
          url: imgAr[0].src
        }, function(err,res,body){
          if ( err ) { throw err; }

          if ( res.statusCode !== 200 ) {

            //Bingo.
            //Found a fucking error.
            //Send a warning.
            warnObj = {
              url: "http://" + blogPosts[blog_id].domain + "/?post_id=" + blogPosts[blog_id].data[key].post_id
            };

            wp.sendWarn(warnObj);

          }

        });

      } else {
        //Unfound image status.
        blogPosts[blog_id].status = 10;
      }
    }
  );

};

exports.sendWarn = function(warnObj) {

  var msgBody;

  msgBody = "A status code of 404 was detected on the following Amazon Product:\n";
  msgBody = msgBody + warnObj.url;

  console.log(msgBody);

  transporter.sendMail({
    from: 'node@nazoma.com',
    to: config.warn.email,
    subject: 'Broken product on Nazoma',
    text: msgBody
  }, function(err){
    if (err) { throw err; }
  });

};
