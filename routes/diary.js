var express = require('express');
var router = express.Router();

var{checkLogin,conn,ids,timeFormat} = require("../util");
var{waterfall,series} = require("async");

router.post("/commonwrite",(req,res)=>{
    var dataget = req.body;
    var loginname = req.session.loginname;
    var loginid = req.session.loginid;
    console.log(dataget);
    conn((err,db)=>{
        var table = db.collection("comment");
        ids(db,"comment",(id)=>{
            dataget["id"] = id;
            var datetime = new Date();
            datetime = timeFormat(datetime);
            dataget["time"] = datetime;
            dataget["username"] = loginname;
            dataget["userid"] = loginid;
            table.insert(dataget,(err,result)=>{
                if(err) throw err;
                res.send({msg:"插入成功"});
            })
        })
    })
})

router.post("/asy",(req,res)=>{
    var asyvalue = req.body.asyvalue*1 || -1;
    console.log(asyvalue);
    var count = 0;
    var totalpage = 0;
    var pagesize = 6;
    var pagenum = parseInt(req.body.pagenum) || 0 ;
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
            table.find().sort({"id":asyvalue}).skip((pagenum-1)*pagesize).limit(pagesize).toArray((err,result)=>{
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
        res.send({"result":result[1],pagenum,totalpage});
      })
})

router.post("/commondel",(req,res)=>{
    var delid = req.body.delid*1;
    conn((err,db)=>{
        var table = db.collection("comment");
        table.deleteOne({"id":delid},(err,result)=>{
            if(err) throw err;
            console.log(result);
            res.send({"msg":"删除成功"});
        })
    })
})
module.exports = router;