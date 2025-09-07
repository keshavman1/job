// frontend/src/App.jsx
import React, { useContext, useEffect } from "react";
import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./components/Home/Home";
import Dashboard from "./components/Dashboard/Dashboard";
import FindPeople from "./components/People/FindPeople";
import Jobs from "./components/Job/Jobs";
import JobDetails from "./components/Job/JobDetails";
import Application from "./components/Application/Application";
import MyApplications from "./components/Application/MyApplications";
import PostJob from "./components/Job/PostJob";
import NotFound from "./components/NotFound/NotFound";
import MyJobs from "./components/Job/MyJobs";

import { Context } from "/src/context.jsx";
import { socket } from "/src/socket.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

// set axios defaults (so we don't have to pass withCredentials every request)
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE;

// Token fallback: if a token exists in localStorage, use it as Authorization header.
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, user } = useContext(Context);

  // Run once on mount to fetch current user (if any)
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const response = await axios.get("/user/getuser"); // axios.baseURL + endpoint
        const userData = response?.data?.user;
        if (mounted && userData) {
          setUser(userData);
          setIsAuthorized(true);
          // store token fallback if returned by server
          if (response?.data?.token) {
            localStorage.setItem("token", response.data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
          }
        } else if (mounted) {
          setIsAuthorized(false);
        }
      } catch (error) {
        if (mounted) {
          setIsAuthorized(false);
        }
        console.warn("Not logged in or failed to fetch user.");
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsAuthorized, setUser]);

  // Register socket for real-time events once user is known
  useEffect(() => {
    if (user && user._id) {
      try {
        socket.connect?.(); // ensure socket connected
        socket.emit("register", user._id);
        console.log("Socket registered for user:", user._id);
      } catch (err) {
        console.warn("Socket register failed:", err);
      }
    }
  }, [user]);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/job/getall" element={<Jobs />} />
          <Route path="/job/:id" element={<JobDetails />} />
          <Route path="/application/:id" element={<Application />} />
          <Route path="/applications/me" element={<MyApplications />} />
          <Route path="/job/post" element={<PostJob />} />
          <Route path="/job/me" element={<MyJobs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/people" element={<FindPeople />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
