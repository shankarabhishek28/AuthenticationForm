import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
})
    .then(() => console.log("connected db"))
    .catch((e) => console.log(e));
const app = express();


const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})
const User = mongoose.model("User",userSchema);

//middlewares
app.use(express.static(path.join(path.resolve(), "public")));
//the statement above is using express to send static files to absolute path with public
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
//above code is fetching data from url of the form
const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token;
    console.log("token =",token);
    if(token) {
        const decoded = jwt.verify(token,"secretttttt");
        req.user= await User.findById(decoded._id);
        next()
    }
        else{
            res.redirect("/login");
        } 
    
    
}
app.set("view engine", "ejs");
app.get("/", isAuthenticated, (req, res) => {
    // console.log(req.user)
    res.render("logout",{name:req.user.name})
    
    
})
app.get("/login",(req,res)=>{
    
    res.render("login")
})
app.get("/register",(req,res)=>{
    const name = req.body.name;
    console.log(name)
    res.render("register")
})

//function below sets the cookie
app.post("/register",async(req,res)=>{

    
    const{name,email,password} = req.body;
    const checkAuth = await User.findOne({email});
    if(checkAuth){
        return res.redirect("/login")
    }
    const hashedPass = await bcrypt.hash(password,10);
    const user = await User.create({name,email,password:hashedPass});
    
    const token = jwt.sign({_id:user._id},"secretttttt")
    
  
    
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/")
})
app.post("/login",async(req,res) => {
    const{email,password} = req.body;
    if(email === "") return res.render("login",{message:"Empty Fields Detected"});
    let user = await User.findOne({email});
    if(!user) return res.redirect("/register");
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.render("login",{email,message:"Incorrect Passsword"});
    const token = jwt.sign({_id:user._id},"secretttttt")
    
  
    
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/")
})
//function below delets the cookie
app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
})


app.listen(5000, () => {
    console.log("sun rha hu")
});