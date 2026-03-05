
import axios from 'axios';

const API_URL=import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

export const API=axios.create({
  baseURL:API_URL,
  headers:{
    'Content-Type':"application/json"
  }
});

//Add interceptor to include token in requests
API.Interceptors.request.use(
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
API.Interceptors.response.use(
  (response)=>{
    return response;
  },
  (error)=>{
    return Promise.reject(error);
  }
);  

//Export API methods
export const api={}

