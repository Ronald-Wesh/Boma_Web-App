// USED FOT http requests
//MESSENGER BTW FRONTEND AND BACKEND
import axios from 'axios';

//access backend url
const API_URL=import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

//crate custom axios instance
export const API=axios.create({
  //base url for all requests
  baseURL:API_URL,
  headers:{
    'Content-Type':"application/json"
  }
});

//Add interceptor to include token in requests
API.interceptors.request.use(
  (config)=>{
    const token=localStorage.getItem("token");
    if(token){
      config.headers['Authorization']=`Bearer ${token}`;
    }
    return config;
  },
  (error)=>{
    return Promise.reject(error);
  }
);

//Add interceptor to handle responses
API.interceptors.response.use(
  (response)=>{
    return response;
  },
  (error)=>{
    return Promise.reject(error);
  }
);  

//Export API methods
export const api={}

