// require('dotenv').config({path:"./env"})

import dotenv from "dotenv";
import connectDB from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
  path: "./env",
});

connectDB()
.then(
  ()=>{
    app.on("error",(error)=>{
      console.log(`Error occured on the connecting db ${error}`);
    })
    app.listen(process.env.port || 8000,()=>{
      console.log(`Server is listening at PORT:${process.env.PORT}`);
    })
  }
)
.catch((err)=>{
  console.log("db connection failed",err)
})


