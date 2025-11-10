const connectDb=require("./Config/db")
const dotenv=require("dotenv");

dotenv.config();

const app=express();
const PORT=process.env.PORT ||5000;

app.listen(PORT,()=>{
    console.log(`Sever is running on port ${PORT}`);
})