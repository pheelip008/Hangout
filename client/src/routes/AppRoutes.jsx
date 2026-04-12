import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/home";
import Meeting from "../pages/meeting";
import Login from "../pages/login"


function AppRoutes() {
    return (
        <>
            <Routes>
                {/* <Route path="/" element={<Home />} /> */}
                <Route path="/meeting" element={<Meeting />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />
                
                
            </Routes>
        </>
    )
}
export default AppRoutes;