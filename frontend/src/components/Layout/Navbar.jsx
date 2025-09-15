import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "/src/context.jsx";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";
import "./Navbar.css";

/*
  Navbar behavior:
  - If not authorized: show Login + Register (right)
  - If authorized:
      * Show Dashboard, Find People
      * If role !== 'Employer' show All Jobs
      * Always show My Applications (label changes if employer)
      * If role === 'Employer' show Post Job and My Jobs
      * Show Logout button
*/

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigate = useNavigate();

  // Normalize role string for comparisons
  const role = user && user.role ? String(user.role).toLowerCase() : "";

  const handleLogout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/v1/user/logout`,
        { withCredentials: true }
      );
    } catch (err) {
      console.warn("Logout failed:", err?.response?.data || err);
    } finally {
      // client-side cleanup
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      if (typeof setUser === "function") setUser(null);
      if (typeof setIsAuthorized === "function") setIsAuthorized(false);
      toast.success("Logged out");
      navigate("/login");
      setOpen(false);
    }
  };

  return (
    <header className="site-nav">
      <div className="nav-inner container">
        {/* Brand */}
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-icon" />
          JobNest
        </Link>

        {/* Nav links - desktop & mobile drawer */}
        <nav className={`nav-links ${open ? "open" : ""}`}>
          {isAuthorized ? (
            <>
              {/* Common logged-in links */}
              <Link to="/dashboard" className="nav-link" onClick={() => setOpen(false)}>
                Dashboard
              </Link>

              <Link to="/people" className="nav-link" onClick={() => setOpen(false)}>
                Find People
              </Link>

              {/* All Jobs visible to non-employers */}
              {role !== "employer" && (
                <Link to="/job/getall" className="nav-link" onClick={() => setOpen(false)}>
                  All Jobs
                </Link>
              )}

              {/* My Applications - label changes for employer */}
              <Link to="/applications/me" className="nav-link" onClick={() => setOpen(false)}>
                {user?.role === "Employer" ? "Applicant's Applications" : "My Applications"}
              </Link>

              {/* Employer-specific */}
              {user?.role === "Employer" && (
                <>
                  <Link to="/job/post" className="nav-link" onClick={() => setOpen(false)}>
                    Post Job
                  </Link>
                  <Link to="/job/me" className="nav-link" onClick={() => setOpen(false)}>
                    My Jobs
                  </Link>
                </>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn btn-logout"
                style={{ marginLeft: 6 }}
              >
                Logout
              </button>
            </>
          ) : (
            // Not authorized: show Login + Register
            <>
              <Link to="/login" className="btn btn-login" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-register" onClick={() => setOpen(false)}>
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Hamburger button */}
        <button
          className="hamburger"
          onClick={() => setOpen((s) => !s)}
          aria-label="menu"
        >
          {open ? <AiOutlineClose size={22} /> : <GiHamburgerMenu size={22} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
