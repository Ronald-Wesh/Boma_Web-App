import {useState,useEffect} from 'react';//usestate-store data
import { listingAPI,API } from '../Utils/api';//API-make custom req(del)
import {useAuth} from "../hooks/useAuth"//get logged in users info
import { useNavigate } from 'react-router-dom';//Move btw pages
import ListingCard from "../components/ListingCard"
import ListingDialog from "../components/ListingDialog"
import { toast } from "sonner";

export default function Listings({onSelect}){
  const [listings,setListings]=useState([]);//store listings from backend
  const [search,setSearch]=useState("");//what users type in search bar
  const [filter,setFilter]=useState("");//filter by type
  const [verified,setVerified]=useState(false);//only show verified listings
  const [loading,setLoading]=useState(true);//Show loading spinner

  const navigate=useNavigate();//move btw pages
  const {user}=useAuth();//logged in user

  //fetch listings from backend
  useEffect(()=>{//runs when page loads,search,filter,verified changes
    const fetchListings=async()=>{//Frontend sends OBJECT → Axios builds URL → Backend receives query
      setLoading(true);//start loading
      try{
        // const params=[];//build an empty array=store filters as strings
        // if(search) params.push(`search=${encodeURIComponent(search)}`);//search term
        // if(filter) params.push(`type=${filter}`);//type filter
        // if(verified) params.push(`verified=${verified}`);//verified filter
        // const query=params.length>0?`?${params.join('&')}`:'';//join filters with &=combines everything
        // const response=await listingAPI.getAllListings(query);//get listings from backend
        const params = {
          ...(search && { search }),
          ...(filter && { type: filter }),
          ...(verified && { verified: true }),
        };

        const response = await listingAPI.getAllListings(params);
        setListings(response.data);//store listings-UI updates
      }catch(error){
        console.error('Error fetching listings:',error);
        toast.error('Failed to fetch listings');
      }finally{
        setLoading(false);//stop loading
      }
    }
    fetchListings();//run fetchListings
  },[search,filter,verified]);//rerun when these change

  //HANDLE CREATE
}

return(
  <div className="p-6">
    
  </div>
)