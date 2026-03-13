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

//Export Auth API endpoints
export const authApi={
  register:(userData)=>API.post('/auth/register',userData),
  login:(credentials)=>API.post('/auth/login',credentials),
  getProfile:()=>API.get('/auth/get-profile'),
  getme:()=>API.get('/auth/me'),
  
}

//Listing Api endpoints
export const listingAPI={
  createListing:(listingData)=>API.post('/listings',listingData),
  getAllListings:()=>API.get('/listings'),
  getListingById:(id)=>API.get(`/listings/${id}`),
  updateListing:(id,listingData)=>API.put(`/listings/${id}`,listingData),
  deleteListing:(id)=>API.delete(`/listings/${id}`)
}

// //Export Image API endpoints
// export const imageAPI={
//   uploadImage:(formData)=>API.post('/images/upload',formData,{headers:{'Content-Type':'multipart/form-data'}}),
//   deleteImage:(publicId)=>API.delete(`/images/${publicId}`),
// }

//Building API endpoints
export const buildingAPI={
  getBuildingListings:(id)=>API.get(`buildings/${id}/listings`),
  getBuildingInsights:(id)=>API.get(`buildings/${id}/listings`),
  getNearbyBuildings:(id)=>API.get(`buildings/${id}/listings`),
}

//Review API endpoints
export const reviewAPI={
  createReview:(id,reviewData)=>API.post(`buildings/${id}/reviews`,reviewData),
  getBuildingReviews:(id)=>API.get(`buidings/${id}/reviews`),
  updateReview:(id,reviewData)=>API.put(`reviews/${id}`,reviewData),
  deleteReview:(id)=>API.delete(`reviews/${id}`),
  markHelpful:(id)=>API.patch(`reviews/${id}/helpful`),
}

//Forum API endpoints

export const forumAPI={
  createForum:(id,forumData)=>API.post(`buildings/${id}/forums`,forumData),
  getBuildingForums:(id)=>API.get(`buildings/${id}/forums`),
  getAllForums:()=>API.get('/forums'),
  deleteForum:(id)=>API.delete(`/forums/${id}`)
}

export const adminAPI={
  verifyUser:(id)=>API.patch(`/admin/verify-user/${id}`),
  verifyListing:(id)=>API.patch(`/admin/verify-listing/${id}`)
}


