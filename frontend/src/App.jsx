import React, { useContext, useEffect } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

// Pages & Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./components/Home/Home";          // ✅ role-based frontpage
import Dashboard from "./components/Dashboard/Dashboard";
import FindPeople from "./components/People/FindPeople";

// Jobs
import Jobs from "./components/Job/Jobs";
import JobDetails from "./components/Job/JobDetails";
import Application from "./components/Application/Application";
import MyApplications from "./components/Application/MyApplications";
import PostJob from "./components/Job/PostJob";
import MyJobs from "./components/Job/MyJobs";
import NotFound from "./components/NotFound/NotFound";

import { Context } from "/src/context.jsx";
import { socket } from "/src/socket.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

// axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE;

// token fallback
const savedToken = localStorage.getItem("token");
if (savedToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, user } = useContext(Context);

  // fetch current user
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const response = await axios.get("/user/getuser");
        const userData = response?.data?.user;

        if (mounted && userData) {
          setUser(userData);
          setIsAuthorized(true);

          if (response?.data?.token) {
            localStorage.setItem("token", response.data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
          }
        } else if (mounted) {
          // no user returned
          setUser(null);
          setIsAuthorized(false);
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setIsAuthorized(false);
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        }
        console.warn("Not logged in or failed to fetch user.");
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setUser(null);
      setIsAuthorized(false);
    }

    return () => {
      mounted = false;
    };
  }, [setIsAuthorized, setUser]);

  // socket register
  useEffect(() => {
    if (user && user._id) {
      try {
        socket.connect?.();
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
          {/* ✅ Role-based Home (LandingPage if not logged in, otherwise seeker/employer hero) */}
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Jobs */}
          <Route path="/job/getall" element={<Jobs />} />
          <Route path="/job/:id" element={<JobDetails />} />
          <Route path="/application/:id" element={<Application />} />
          <Route path="/applications/me" element={<MyApplications />} />
          <Route path="/job/post" element={<PostJob />} />
          <Route path="/job/me" element={<MyJobs />} />

          {/* Others */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/people" element={<FindPeople />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
