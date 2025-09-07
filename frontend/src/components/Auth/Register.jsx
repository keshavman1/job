// frontend/src/components/Auth/Register.jsx
import React, { useContext, useState } from "react";
import { FaRegUser, FaPencilAlt } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { FaPhoneAlt } from "react-icons/fa";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "/src/context.jsx";
import QuizPopup from "./QuizPopup";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${API_BASE}/user/register`,
        { name, phone, email, role, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success(data.message || "Registered");

      // Token fallback: save token and set axios Authorization header
      if (data.token) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      }

      if (data.user) setUser(data.user);
      setIsAuthorized(true);

      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  if (isAuthorized) return <Navigate to="/" replace />;

  return (
    <>
      <section className="authPage">
        <div className="container">
          <div className="header">
            <img src="/careerconnect-black.png" alt="logo" />
            <h3>Create a new account</h3>
          </div>

          <form onSubmit={handleRegister}>
            <div className="inputTag">
              <label>Register As</label>
              <div>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">Select Role</option>
                  <option value="Employer">Employer</option>
                  <option value="Job Seeker">Job Seeker</option>
                </select>
                <FaRegUser />
              </div>
            </div>

            <div className="inputTag">
              <label>Name</label>
              <div>
                <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
                <FaPencilAlt />
              </div>
            </div>

            <div className="inputTag">
              <label>Email Address</label>
              <div>
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <MdOutlineMailOutline />
              </div>
            </div>

            <div className="inputTag">
              <label>Phone Number</label>
              <div>
                <input type="text" placeholder="Enter your phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <FaPhoneAlt />
              </div>
            </div>

            <div className="inputTag">
              <label>Password</label>
              <div>
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <RiLock2Fill />
              </div>
            </div>

            <button type="submit">Register</button>
            <Link to="/login">Login Now</Link>
          </form>
        </div>

        <div className="banner">
          <img src="/register.png" alt="login" />
        </div>
      </section>

      <QuizPopup />
    </>
  );
};

export default Register;
