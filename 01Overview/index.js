const express = require('express')

const app = express();
const port = 3000;
app.get("/",(req,res)=>{
    res.send("Hello Backend");
})

app.get('/about',(req,res)=>{
    res.send("Backend created by Devpatel");
})

app.listen(port,()=>{
    console.log(`App listening on port : http://localhost:${port}`)
})