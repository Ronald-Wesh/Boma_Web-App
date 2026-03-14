//Utility functions for authentication and role based access control
//AUTHENTIFCATION TOOL BOX FRO AUTHENTICATION
//manage login, user info, roles, and permissions using the JWT token stored in the browser.


//Decode JWT token to get payload
export const decodeToken=(token)=>{
  try{
    //JWT token have 3 parts:header,payload,signature
    const payload=JSON.parse(atob(token.split('.')[1]))
    return payload;

  }catch(error){
    console.error('Error decoding token',error)
    return null;
  }
} 

//Get the loggedin user from token
export const getLoggedInUser=()=>{
  const token=localStorage.getItem('token');
  //User not logged in
  if(!token) return null;
  //if logged in call previous function
  return decodeToken(token);
}

//If token is expired=Log in session expired
export const isTokenExpired=(token=null)=>{
  //usetoken provided or get from localstorage
  const tokenToCheck=token ||localStorage.getItem('token');
  if(!tokenToCheck) return true;//if no token retuen true=user not authenticated

  const decoded=decodeToken(tokenToCheck);//if token -decode it
  if(!decoded ||!decoded.exp) return true;//if no decoded or no expiration time return true

  //Check if current time is past the expiration time
  const currentTime=Date.now()/1000;//get current time in seconds-hence divide by 1000
  return decoded.exp<currentTime;//return true if expired
};

export const getUserRole=()=>{
  //From local storage get the token
  const userData=localStorage.getItem('user');
  if(userData){
    try{
      const user=JSON.parse(userData);
      return user.role;
    }catch(error){
      console.error('Error parsing user data',error)
      return null;
    }
  }
  //Fallback if no token
  const tokenUser=getLoggedInUser();
  return tokenUser?.role ||null
}

//ROLE CHECKERS
export const isAdmin=()=>{
  return getUserRole()==='admin';
};
export const isLandlord=()=>{
  return getUserRole()==='landlord';
};
export const isTenant=()=>{
  return getUserRole()==='tenant';
};

//Get username from localstorage
export const getUserName=()=>{
  //get user from local storage
  const userData=localStorage.getItem('user');
  if(userData){
    try{
      const user=JSON.parse(userData);
      return user.name ||user.username ||user.email;
    }
    catch(error){
      console.error('Error parsing user data',error);
      return null;
    }
  }
  //Fallback if no token
  const tokenUser=getLoggedInUser();
  return tokenUser?.username ||tokenUser?.name ||tokenUser?.email ||null; 
};

//GET USER ID
export const getUserId=()=>{
  const userData=localStorage.getItem('user');
  if(userData){
    try{
      const user=JSON.parse(userData);
      return user.id ||user._id;
    }catch(error){
      console.error('Error parsing user data',error);
      return null;
    }
  }
  //Fallback if no token
const tokenUser=getLoggedInUser();
return tokenUser?.id ||tokenUser?._id ||null;
};

//CLEAR AUTH DATA=LOGGED OUT
export const clearAuthData=()=>{
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

//CHECK IF USER IS authenticated
export const isAuthenticated=()=>{
  const token=localStorage.getItem('token');
  const user=localStorage.getItem('user');
  //if both token and user are present and token not expired=user is Aujthenticated
  return token && user && !isTokenExpired(token);
};

//GET AUTHORIZATION HEADER FOR API CALLS=used when calling APIs
export const getAuthHeader=()=>{
  const token=localStorage.getItem('token');
  return token?{Authorization:`Bearer ${token}`}:{};
};

//GET USERNAME FOR PROFILE/UI
  export const getUsername=()=>{
    const userData=localStorage.getItem('token');
    if(userData){
      try{
        const user=JSON.parse(userData);
        return user.name ||user.userName ||user.email.split('@')[0];//get email prefix
      }catch(error){
        console.error("Error parsing userdata",error)
      }
    }
    return 'User';
  };


//ROLE BASED ROUTE PERMISSIONS
//Maps frontend routes to which roles can access them
//Based on backend middleware: public (no auth), protect (any logged-in), isAdmin (admin only)

//Routes that require NO authentication (public)
const publicRoutes=[
  '/',
  '/login',
  '/register',
  '/listings',        // GET /listings - public
  '/listings/:id',    // GET /listings/:id - public
  '/buildings/:id/listings',  // GET - public
  '/buildings/:id/insights',  // GET - public
  '/buildings/:id/nearby',    // GET - public
  '/buildings/:id/reviews',   // GET - public
  '/forums',          // GET /forums - public
];

//Routes that require authentication (any role)
const protectedRoutes=[
  '/dashboard',
  '/profile',
  '/listings/create',         // POST /listings - protect
  '/listings/:id/edit',       // PUT /listings/:id - protect
  '/listings/:id/delete',     // DELETE /listings/:id - protect
  '/buildings/:id/reviews/create',  // POST - protect
  '/reviews/:id/edit',        // PUT - protect
  '/reviews/:id/delete',     // DELETE - protect
  '/reviews/:id/helpful',    // PATCH - protect
  '/forums/create',          // POST - protect
  '/forums/:id/delete',     // DELETE - protect
  '/buildings/:id/forum/create', // POST - protect
  '/settings',
];

//Routes that ONLY admins can access
const adminRoutes=[
  '/admin',
  '/admin/dashboard',
  '/admin/unverified-users',    // GET - protect + isAdmin
  '/admin/verify-user/:id',     // PATCH - protect + isAdmin
  '/admin/unverified-listings', // GET - protect + isAdmin
  '/admin/verify-listing/:id',  // PATCH - protect + isAdmin
  '/admin/users',
  '/admin/listings',
  '/admin/settings',
];

//Helper: normalize route for comparison (replace dynamic params with :id)
const normalizeRoute=(route)=>{//converts /listings/682ab82f3f9382 to /listings/:id
  return route.replace(/\/[a-f0-9]{24}/g,'/:id')  // MongoDB ObjectIds
              .replace(/\/\d+/g,'/:id');           // Numeric IDs
};

//Check if user role can access a specific route
export const canAccessRoute=(route,userRole=null)=>{
  const role=userRole ||getUserRole();
  const normalizedRoute=normalizeRoute(route);

  //Public routes are accessible by everyone
  if(publicRoutes.some(r=>normalizeRoute(r)===normalizedRoute)){//anyone allowed
    return true;
  }

  //If not authenticated, can only access public routes
  if(!role) return false;

  //Protected routes are accessible by any authenticated user
  if(protectedRoutes.some(r=>normalizeRoute(r)===normalizedRoute)){//logged in users allowed
    return true;
  }

  //Admin routes are only accessible by admins
  if(adminRoutes.some(r=>normalizeRoute(r)===normalizedRoute)){
    return role==='admin';
  }

  //Default: deny access to unknown routes
  return false;
};

//Granular permission check for specific actions
//Usage: hasPermission('listings','create') or hasPermission('admin','verifyUser')
export const hasPermission=(resource,action)=>{
  const role=getUserRole();
  if(!role) return false;

  const permissions={
    //Listings permissions
    listings:{
      view:['admin','landlord','tenant'],     // Anyone can view
      create:['admin','landlord','tenant'],            // Landlords,tenants & admin can create
      edit:['admin','landlord','tenant'],              // Landlords,tenants & admin can edit (own)
      delete:['admin','landlord','tenant'],            // Landlords,tenants & admin can delete (own)
    },
    //Review permissions
    reviews:{
      view:['admin','landlord','tenant'],     // Anyone can view
      create:['admin','landlord','tenant'],   // Any authenticated user
      edit:['admin','landlord','tenant'],     // Own reviews only (enforced backend)
      delete:['admin','landlord','tenant'],   // Own reviews only (enforced backend)
      markHelpful:['admin','landlord','tenant'],
    },
    //Forum permissions
    forums:{
      view:['admin','landlord','tenant'],     // Anyone can view
      create:['admin','landlord','tenant'],   // Any authenticated user
      delete:['admin','landlord','tenant'],   // Own posts only (enforced backend)
    },
    //Building permissions
    buildings:{
      view:['admin','landlord','tenant'],     // Anyone can view
    },
    //Admin permissions
    admin:{
      verifyUser:['admin'],
      verifyListing:['admin'],
      viewUnverified:['admin'],
      manageUsers:['admin'],
    },
  };

  const resourcePerms=permissions[resource];
  if(!resourcePerms ||!resourcePerms[action]) return false;
  return resourcePerms[action].includes(role);
};