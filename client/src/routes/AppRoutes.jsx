import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Meeting from "../pages/Meeting";
import Login from "../pages/Login"
import Landing from "../pages/Landing"
import Error from "../pages/Error404";
import Register from "../pages/Register";
import ProtectedRoute from "../routes/ProtectedRoute"
import MainLayout from "../layouts/MainLayout";
import PublicOnlyRoute from "../routes/PublicOnlyRoutes";
function AppRoutes() {
    return (
        <>
            <Routes>
                {/* <Route path="/" element={<Home />} /> */}
                <Route path="/meeting/:roomCode" element={<ProtectedRoute><Meeting /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/error" element={<Error />} />
                <Route path="/register" element={<Register />} />
                <Route element={<MainLayout/>}> 
                        <Route path="/" element={<PublicOnlyRoute><Landing/></PublicOnlyRoute>}/>
                        <Route path ="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
                </Route>
                
                
                
            </Routes>
        </>
    )
}
export default AppRoutes;