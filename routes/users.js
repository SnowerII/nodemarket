var express = require('express');
var router = express.Router();
var {waterfall,series} = require("async");

var multiparty= require("multiparty");
var fs = require("fs");

var {conn,checkLogin,ids,timeFormat} = require("../util");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post("/login",(req,res)=>{
  var body = req.body;
  conn((err,db)=>{
    var table = db.collection("userinfo");
    table.find({"username":body.username}).toArray((err,result)=>{
      if(err)
      {
        throw err;
      }
      else
      {
        var obj = {};
        if(result=="")
        {
          obj = {type:-1,code:200,msg:"没有此用户"};
        }
        else if(result[0].userpwd != body.userpwd)
        {
          obj = {type:0,code:200,msg:"密码错误"};
        }
        else
        {
          obj = {type:1,code:200,msg:"登录成功"};
          req.session.loginname = body.username;
          req.session.loginid = result[0].userid;
        }
        res.send(JSON.stringify(obj));
      }
    })
  })
})

router.post("/register",(req,res)=>{
  var dataget = req.body;
  conn((err,db)=>{
    var table = db.collection("userinfo");
    waterfall([
      (cb)=>{
        table.findOne({"username":dataget.username},(err,result)=>{
          if(err) {
            cb(err,null);
          };
          if(result)
          {
            cb(null,false);
          }
          else
          {
            cb(null,true);
          }
        });
      },
      (able,cb)=>{
        if(able)
        {
          delete dataget.usercode;
          ids(db,"userinfo",(id)=>{
            dataget["userid"] = id;
                table.insert(dataget,(err,result)=>{
                  if(err)
                  {
                    cb(err,null);
                  }
                  cb(null,{type:1,code:200,msg:"注册成功！"});
                });
          })
        }
        else
        {
          cb(null,{type:0,code:200,msg:"存在相同用户"});
        }
      }
    ],(err,result)=>{
      if(err) throw err;
      if(result.type == 1)
      {
        req.session.loginname = dataget.username;
        res.send(result)
      }
      db.close();
    })
  })
})

router.post("/searchclass",(req,res)=>{
  var dataget = req.body.classname;
  conn((err,db)=>{
    var table = db.collection("goods");
    table.find({"type":dataget,"sale":true}).toArray((err,result)=>{
      if(err) throw err;
      console.log(result);
      res.send(result);
    })
  });
})

router.post("/search",(req,res)=>{
  var name = req.body.goodsname;
  conn((err,db)=>{
      var table = db.collection("goods");
      var reg = new RegExp(name,"gi");
      if(!name)
      {
        table.find({"sale":true}).toArray((err,result)=>{
          if(err) throw err;
          res.send(result);
        })
      }
      else
      {
        table.find({"name":{$regex:reg},"sale":true}).toArray((err,result)=>{
          if(err) throw err;
          res.send(result);
        })
      }
      
    }) 
})

router.post("/asygoods",(req,res)=>{
  var delname = req.body.asyname;
  var sortvalue = req.body.asyvalue;
  var type = req.body.type;
  var findobj = {};
  if(type) findobj["type"] = type;

  findobj["sale"] = true;
  conn((err,db)=>{
    var table = db.collection("goods");
    var obj={};
    obj[delname] = sortvalue*1;
    console.log(obj);
    table.find(findobj).sort(obj).toArray((err,result)=>{
      if(err) throw err;
      res.send(result);
    })
  })
})

router.post("/downgoods",(req,res)=>{
  var id = req.body.goodsid*1;
  console.log("down:",id);
  conn((err,db)=>{
    var table = db.collection("goods");
    table.update({"id":id},{$set:{"sale":false}},(err,result)=>{
      if(err)
      {
        throw err;
      }
      else 
      {
        res.send({"msg":"下架完毕"});
      }
    })
  })
})

router.post("/recgoods",(req,res)=>{
  conn((err,db)=>{
    var table = db.collection("goods");
    table.find({"sale":false}).toArray((err,result)=>{
      if(err) throw err;
      if(!result)
      {
        res.send({"msg":"暂无下架商品"});
      }
      else
      {
        res.send(result);
      }
    })
  })
})
router.post("/clear",(req,res)=>{
  var id = req.body.goodsid*1;
  conn((err,db)=>{
    var table = db.collection("goods");
    table.deleteOne({"id":id},(err,result)=>{
      if(err)
      {
        throw err;
      }
      else
      {
        res.send({"msg":"删除完毕"});
      }
    })
  })
})
router.post("/recovery",(req,res)=>{
  var id = req.body.goodsid*1;
  conn((err,db)=>{
    var table = db.collection("goods");
    table.update({"id":id},{$set:{"sale":true}},(err,result)=>{
      if(err)
      {
        throw err;
      }
      else
      {
        res.send({"msg":"恢复完毕"});
      }
    })
  })
})

router.post("/newclass",(req,res)=>{
  var newname = req.body.new_class;
  var newreason = req.body.new_classreason;
  var username = req.session.loginname;
  var userid = req.session.loginid;

  waterfall([
    (cb)=>{
      conn((err,db)=>{
        var table = db.collection("goodsclass");
        table.findOne({"name":newname},(err,result)=>{
          if(err)
          {
            cb(err,null);
          }
          else
          {
            if(result)
            {
              cb(null,false);
            }
            else
            {
              cb(null,true);
            }
          }
        })
      })
    },
    (re,cb)=>{
      if(re)
      {
        conn((err,db)=>{
          var table = db.collection("goodsclass");
          if(userid!=0)
          {
            cb(null,-1);
          }
          else
          {
            ids(db,"goodsclass",(id)=>{
              var insertobj = {"id":id,"name":newname};
              table.insert(insertobj,(err,result)=>{
                if(err)
                {
                  cb(err,null);
                }
                else
                {
                  cb(null,1);
                }
              })
            })
          }
        })
      }
      else
      {
        cb(null,0)
      }
    },
    (type,cb)=>{
      if(type==-1)
      {
        cb(null,{msg:"缺乏管理员权限"});
      }
      else if(type==0)
      {
        cb(null,{msg:"存在相同品类"});
      }
      else if(type == 1)
      {
        conn((err,db)=>{
          var table = db.collection("record");
          ids(db,"record",(id)=>{
            var datetime = new Date();
            datetime = timeFormat(datetime);
            var insertobj = {"id":id,"operator":username,"operatorid":userid,"type":"管理员","operate":"品类添加","reason":newreason,"time":datetime};
            table.insert(insertobj,(err,result)=>{
              if(err) throw err;
              console.log("recorde:",result);
              cb(null,{msg:"品类插入成功"});
            })
          });
        })
      }
    }
  ],(err,result)=>{
    if(err) throw err;
    res.send(JSON.stringify(result));
  });

})

router.post("/addgoods",(req,res)=>{
  console.log('上传图片');
    
  res.send({"msg":"请求收到，暂未完成商品上传功能"});
})

router.post("/updgoods",(req,res)=>{
  var dataget = req.body;
  var num = dataget.goodsnum;
  var id = dataget.goodsid*1;
  var price = dataget.goodsprice;

  var username = req.session.loginname;
  var userid = req.session.loginid;
  var usertype; 
  if(userid!=0)
  {
    usertype = "员工";
  }
  else
  {
    usertype = "管理员";
  }
  series([
    (cb)=>{
      conn((err,db)=>{
        var table = db.collection("goods");
        table.update({"id":id},{$set:{"storage":num,"price":price}},(err,result)=>{
          if(err)
          {
            cb(err,null);
          }
          else{
            cb(null,true);
          } 
        })
      })
    },
    (cb)=>{
      conn((err,db)=>{
        var table = db.collection("record");
        ids(db,"record",(id)=>{
          var datetime = new Date();
          datetime = timeFormat(datetime);
          var insertobj = {"id":id,"operator":username,"operatorid":userid,"type":usertype,"operate":"商品修改","reason":"","time":datetime};
          table.insert(insertobj,(err,result)=>{
            if(err) cb(err,null);
            cb(null,{msg:"商品修改完毕"});
          })
        });
      })
    }
  ],(err,result)=>{
    if(err) throw err;
    res.send(result[1]);
  })
  
})

router.post("/delclass",(req,res)=>{
  var dataget = req.body;
  var delname = dataget.del_classname;
  var delreason = dataget.del_classreason;
  var username = req.session.loginname;
  var userid = req.session.loginid;

  waterfall([
    (cb)=>{
      if(userid!=0)
      {
        cb(null,-1);
      }
      else
      {
        conn((err,db)=>{
          var table = db.collection("goodsclass");
          table.deleteOne({"name":delname},(err,result)=>{
            if(err){
              cb(err,null);
            }
            else{
              cb(null,1);
            }
          })
        })
      }
    },
    (type,cb)=>{
      if(type==1)
      {
        conn((err,db)=>{
          var table = db.collection("record");
          ids(db,"record",(id)=>{
            var datetime = new Date();
            datetime = timeFormat(datetime);
            var insertobj = {"id":id,"operator":username,"operatorid":userid,"type":"管理员","operate":"品类删除","reason":delreason,"time":datetime};
            table.insert(insertobj,(err,result)=>{
              if(err) throw err;
              console.log("recorde:",result);
              cb(null,{msg:"删除完毕"});
            })
          });
        })
      }
      else
      {
        cb(null,{msg:"缺乏管理员权限"});
      }
    }

  ],(err,result)=>{
    if(err) throw err;
    res.send(JSON.stringify(result));
  })
})




// 上传图片
router.post("/uploadimg",(req,res)=>{
    console.log('上传图片');
    var form = new multiparty.Form();   // 实例化 
    // 编码
    form.encoding = "UTF-8";
    // 图片上传的临时存储路径 
    form.uploadDir = "./uploadtemp";
    // 图片的最大内存  
    form.maxFilesSize = 8*1024*1024   // 8M
    form.parse(req,(err,fields,files)=>{
        if(err){
            throw err;
            res.json({err:err,msg:"上传图片失败"})
        }
        // fields  文件域 
        // files 文件 
        console.log(fields);
        console.log(files);
        var uploadUrl = "/images/upload/";   // 文件的服务器路径 
        file = files['filedata']; // 当前图片对象 
        originalFilename = file[0].originalFilename  // 文件的初始化名称  // 1.jpg  

        tempath = file[0].path;  // 文件的临时路径  
        console.log(tempath);

        var timestamp = new Date().getTime();  // 时间戳 
        uploadUrl += timestamp + originalFilename ;  //   /images/upload/8888881.jpg 
        newpath = "./public"+uploadUrl;

        // 通过文件流读取图片 
        var fileReadStream = fs.createReadStream(tempath);
        var fileWriteStream = fs.createWriteStream(newpath);

        fileReadStream.pipe(fileWriteStream);  // 读取文件  
        // 监听文件上传 
        fileWriteStream.on("close",()=>{
            // 删除临时文件 
            fs.unlinkSync(tempath);
            res.json({err:'',msg:uploadUrl})
        })

    })
})

module.exports = router;
