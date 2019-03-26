$("#logout").bind("click",function()
    {
      if(confirm("确定要注销吗?"))
      {
        window.location.href = "/logout";
      }
    })