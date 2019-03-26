var express = require('express');
var router = express.Router();

var{checkLogin,conn} = require("../util");
var{waterfall,series} = require("async");

/* GET home page. */
router.get('/', function(req, res, next) {
  var loginname = req.session.loginname;
  res.render('index', { title: '微型超市管理系统', loginname});
});

router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect("/");
})

router.get('/goodslist',(req,res)=>{
  var loginname = req.session.loginname;
  var loginid = req.session.loginid;

  checkLogin(loginname,res,()=>{
    var returnobj = {};
    series([
      (cb)=>{
        conn((err,db)=>{
          if(err) throw err;
          db.collection("goodsclass").find().toArray((err,result)=>{
            if(err) cb(err,null);
            returnobj["goodsclass"] = result;
            cb(null,true);
          })
        });
      },
      (cb)=>{
        conn((err,db)=>{
          if(err) throw err;
          db.collection("goods").find({"sale":true}).toArray((err,result)=>{
            if(err) cb(err,null);
            returnobj["goodsdata"] = result;
            cb(null,true);
          })
        });
      }
    ],(err,result)=>{
      if(err) throw err;
      returnobj["loginname"] = loginname;
      returnobj["loginid"] = loginid;
      res.render("goodslist",returnobj);
    });  
  })
})

router.get('/diary',(req,res)=>{
  var loginname = req.session.loginname;
  var loginid = req.session.loginid;

  checkLogin(loginname,res,()=>{
    var count = 0;
    var totalpage = 0;
    var pagesize = 6;
    var pagenum = parseInt(req.query.pagenum) || 0 ;

    series([
      (cb)=>{
        conn((err,db)=>{
          var table = db.collection("comment");
          table.find().toArray((err,result)=>{
            if(err)
            {
              cb(err,null);
            } 
            else
            {
              count = result.length;
              totalpage = Math.ceil(count/pagesize);
              pagenum = pagenum <= 1?1 : pagenum;
              pagenum = pagenum >=totalpage?totalpage : pagenum;
              cb(null,true);
            }
          })
        })
      },
      (cb)=>{
        conn((err,db)=>{
          var table = db.collection("comment");
          if(pagenum<1){pagenum=1;}
          table.find().sort({"_id":-1}).skip((pagenum-1)*pagesize).limit(pagesize).toArray((err,result)=>{
            if(err)
            {
              cb(err,null);
            }
            else
            {
              cb(null,result);
            }
          })
        })
      }
    ],(err,result)=>{
      if(err) throw err;
      console.log("diary:",result);
      res.render("diary",{loginid,loginname,result:result[1],count,pagenum,totalpage,pagesize});
    })
    

     
  })
})

router.get('/record',(req,res)=>{
  var loginname = req.session.loginname;
  var loginid = req.session.loginid;

  var count = 0;
  var totalpage = 0;
  var pagesize = 6;
  var pagenum = parseInt(req.query.pagenum) || 0 ;

  checkLogin(loginname,res,()=>{
    if(loginid!=0)
    {
      res.send("<script>alert('您不是管理员！');window.history.go(-1);</script>");
    }
    else
    {
      series([
        (cb)=>{
          conn((err,db)=>{
            var table = db.collection("record");
            table.find().toArray((err,result)=>{
              if(err)
              {
                cb(err,null);
              } 
              else
              {
                count = result.length;
                totalpage = Math.ceil(count/pagesize);
                pagenum = pagenum <= 1?1 : pagenum;
                pagenum = pagenum >=totalpage?totalpage : pagenum;
                cb(null,true);
              }
            })
          })
        },
        (cb)=>{
          conn((err,db)=>{
            var table = db.collection("record");
            if(pagenum<1){pagenum=1;}
            table.find().sort({"_id":-1}).skip((pagenum-1)*pagesize).limit(pagesize).toArray((err,result)=>{
              if(err)
              {
                cb(err,null);
              }
              else
              {
                cb(null,result);
              }
            })
          })
        }
      ],(err,result)=>{
        if(err) throw err;
        res.render("record",{loginname,result:result[1],count,pagenum,totalpage,pagesize});
      })
    } 
  })
})

module.exports = router;
