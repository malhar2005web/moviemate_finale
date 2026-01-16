import mongoose from 'mongoose'
import { ENV_VARS } from './envVars.js'
import { error } from 'console'
export const connectDB=async()=>{
    try{
        const conn= await mongoose.connect(ENV_VARS.MONGO_URI)
        console.log("Mongosss:"+conn.connection.host);

    }catch(error){
        console.error("error:"+error.message)
        console.error("Proceeding without a database connection. Server will run in degraded mode.")
        // Do not exit the process here; allow the server to start for local development
        return
    }
}
