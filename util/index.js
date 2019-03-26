var {MongoClient} = require("mongodb");

function conn(callback)
{
    var str = "mongodb://60.205.225.215:27017/micromarket";

    MongoClient.connect(str,(err,db)=>{
        if(err) {callback(err,null);throw err;}
        console.log("数据库连接成功");
        callback(null,db);
    })
}


function checkLogin(name,res,callback)
{
    if(name)
    {
        callback();
    }
    else
    {
        res.send("<script>alert('请先登录！');location.href='/';</script>");
    }
}

// function checkRe(db,formname,rename,revalue,callback)
// {
//     db.collection(formname).findOne({rename:revalue},(err,result)=>{
//         if(err) throw err;
//         if(result)
//         {
//             callback(false);
//         }
//         else
//         {
//             callback(true);
//         }
//     })
// }

function ids(db,formmname,callback)
{
    db.collection("ids").findAndModify(
        {"collectionname":formmname},
        [],
        {$inc:{"id":1}},
        {new:true},
        function(err,result)
        {
            if(err)
            {
                throw err;
            }
            else
            {
                callback(result.value.id);
            }
        }
    )
}

function timeFormat(time)
{
    var date = new Date(time);
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();

    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}

module.exports = {conn,checkLogin,ids,timeFormat};