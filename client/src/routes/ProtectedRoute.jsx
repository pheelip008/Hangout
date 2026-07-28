import React from 'react'
import { useState,useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import API_BASE from '../config'
import Loader from '../components/Loader';

const ProtectedRoute = ({children}) => {
    const[isAuthenticated,setIsAuthenticated]=useState(null);
    useEffect(()=>{
        fetch(`${API_BASE}/api/auth/me`,{
            credentials:'include'
        }).then(res=>res.json())
        .then(data=>{
            setIsAuthenticated(data.success);
        }).catch(()=>{
            setIsAuthenticated(false);
        });

    },[]);
    if(isAuthenticated==null){
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <Loader />
            </div>
        );
    }
    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }
    return children;
  
}

export default ProtectedRoute