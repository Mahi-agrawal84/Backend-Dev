 const os=require("os");
 const fs=require("fs");
 const totalMemory= os.totalmem()/(1024*1024*1024);
 const freeMemory= os.freemem()/(1024*1024*1024);

 const platform= os.platform()
 const uptime= os.uptime()/(3600)

 const model= os.cpus()[0].model

 const systemlog= `
 Total memory: ${totalMemory}
 Free memory: ${freeMemory}
 UpTime: ${uptime}
 Model: ${model}
 Platform: ${platform}
 `
 setInterval(()=>{
 fs.appendFile("./system_log.txt",systemlog, (err)=>{
    if(err){
        console.log(err)
    }
 })
 },3000)

//  console.log(totalMemory,platform,uptime,model);