// frontend/src/components/Layout/Navbar.jsx
import React, { useContext, useState } from "react";
import { Context } from "/src/context.jsx";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";

const NAV_HEIGHT = 72; // px - adjust if you prefer a different navbar height

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      // call backend logout endpoint (your existing endpoint)
      await axios.get("http://localhost:4000/api/v1/user/logout", { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err?.response?.data || err);
    } finally {
      // client-side cleanup
      localStorage.removeItem("token");
      if (typeof setUser === "function") setUser(null);
      if (typeof setIsAuthorized === "function") setIsAuthorized(false);
      toast.success("Logged out");
      navigateTo("/login");
    }
  };

  // Inline styles are intentional to override any external CSS that was pushing items up.
  const navRootStyle = {
    height: `${NAV_HEIGHT}px`,
    display: "flex",
    alignItems: "center", // center vertically
    background: "#1b1c1d",
    color: "#fff",
  };

  const innerStyle = {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    alignItems: "center", // center vertically
    justifyContent: "space-between",
    boxSizing: "border-box",
  };

  const menuStyle = {
    display: "flex",
    alignItems: "center",
    gap: 20,
    listStyle: "none",
    margin: 0,
    padding: 0,
  };

  // normalize role string if available
  const role = user && user.role ? String(user.role).toLowerCase() : "";

  return (
    // apply navRootStyle at the nav level so everything inside is vertically centered
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"} style={navRootStyle}>
      <div className="container" style={innerStyle}>
        {/* Left: Logo */}
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/"
            onClick={() => setShow(false)}
            style={{
              textDecoration: "none",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: 0.5,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            JobNext
          </Link>
        </div>

        {/* Center / Links */}
        <ul className={!show ? "menu" : "show-menu menu"} style={menuStyle}>
          {/* Home link removed as requested */}

          {/* Always show Dashboard / People only when logged in */}
          {isAuthorized ? (
            <>
              <li>
                <Link to={"/dashboard"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                  DASHBOARD
                </Link>
              </li>

              <li>
                <Link to={"/people"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                  FIND PEOPLE
                </Link>
              </li>

              {/* Show ALL JOBS only for non-employer roles */}
              {role !== "employer" && (
                <li>
                  <Link to={"/job/getall"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                    ALL JOBS
                  </Link>
                </li>
              )}

              <li>
                <Link to={"/applications/me"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                  {user && user.role === "Employer" ? "APPLICANT'S APPLICATIONS" : "MY APPLICATIONS"}
                </Link>
              </li>

              {/* Employer specific links */}
              {user && user.role === "Employer" ? (
                <>
                  <li>
                    <Link to={"/job/post"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                      POST NEW JOB
                    </Link>
                  </li>
                  <li>
                    <Link to={"/job/me"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                      VIEW YOUR JOBS
                    </Link>
                  </li>
                </>
              ) : null}

              {/* Logout button */}
              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "1px solid #fff",
                    padding: "6px 12px",
                    borderRadius: 6,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  LOGOUT
                </button>
              </li>
            </>
          ) : (
            // Not authorized: show Login / Register only
            <>
              <li>
                <Link to={"/login"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                  LOGIN
                </Link>
              </li>
              <li>
                <Link to={"/register"} onClick={() => setShow(false)} style={{ color: "#fff" }}>
                  REGISTER
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Hamburger (mobile) */}
        <div className="hamburger" onClick={() => setShow(!show)} style={{ cursor: "pointer" }}>
          {show ? <AiOutlineClose size={20} color="#fff" /> : <GiHamburgerMenu size={20} color="#fff" />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
