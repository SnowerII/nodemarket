var express = require('express');
var router = express.Router();

var{checkLogin,conn} = require("../util");
var{waterfall,series} = require("async");

router.post("/delrec",(req,res)=>{
    var id = req.body.recid*1;
    conn((err,db)=>{
        var table = db.collection("record");
        table.deleteOne({"id":id},(err,result)=>{
            if(err) throw err;
            res.send({"msg":"删除完毕"});
        })
    })
})

module.exports = router;