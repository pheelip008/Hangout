import React from 'react'
import { useState,useEffect } from 'react'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({children}) => {
    const[isAuthenticated,setIsAuthenticated]=useState(null);
    useEffect(()=>{
        fetch('http://localhost:3000/api/auth/me',{
            credentials:'include'
        }).then(res=>res.json())
        .then(data=>{
            setIsAuthenticated(data.success);
        }).catch(()=>{
            setIsAuthenticated(false);
        });

    },[]);
    if(isAuthenticated==null){
        return <p>Loading...</p>
    }
    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }
    return children;
  
}

export default ProtectedRoute