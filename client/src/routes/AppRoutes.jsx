import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/home";
import Meeting from "../pages/meeting";
import Login from "../pages/login"
import Landing from "../pages/landing"
import Error from "../pages/Error404";
import Register from "../pages/Register";
import ProtectedRoute from "../routes/ProtectedRoute"

function AppRoutes() {
    return (
        <>
            <Routes>
                {/* <Route path="/" element={<Home />} /> */}
                <Route path="/meeting" element={<ProtectedRoute><Meeting /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/error" element={<Error />} />
                <Route path="/register" element={<Register />} />
                
                
                
            </Routes>
        </>
    )
}
export default AppRoutes;