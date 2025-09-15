// frontend/src/components/Auth/Register.jsx
import React, { useContext, useState } from "react";
import { FaRegUser, FaPencilAlt, FaPhoneAlt } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "/src/context.jsx";
import QuizPopup from "./QuizPopup";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

const gradientBtn = {
  background: "linear-gradient(90deg,#0d6efd,#2b8ecc)",
  color: "#fff",
  border: "none",
  boxShadow: "0 10px 28px rgba(11,97,200,0.12)",
};

const cardStyle = {
  borderRadius: 14,
  boxShadow: "0 18px 48px rgba(6,27,62,0.06)",
  border: "1px solid rgba(10,40,80,0.02)",
  overflow: "hidden",
};

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

      // Token fallback
      if (data.token) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      }

      if (data.user) setUser(data.user);
      setIsAuthorized(true);

      // clear
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
      <section
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          background: "#f5f9fc",
          padding: "2rem",
          paddingTop: "100px", // <-- prevents navbar overlap
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-sm-10 col-md-8 col-lg-6">
              <div style={cardStyle} className="bg-white p-4 p-md-5">
                <div className="mb-4 text-center">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "linear-gradient(135deg,#0d6efd,#2b8ecc)",
                      }}
                    />
                    <h4 style={{ margin: 0, fontWeight: 800, color: "#0b2b52" }}>Create an account</h4>
                  </div>
                </div>

                <form onSubmit={handleRegister}>
                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Register As</label>
                    <div className="input-group">
                      <select
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="Employer">Employer</option>
                        <option value="Job Seeker">Job Seeker</option>
                      </select>
                      <span className="input-group-text bg-white">
                        <FaRegUser />
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Name</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <span className="input-group-text bg-white">
                        <FaPencilAlt />
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <span className="input-group-text bg-white">
                        <MdOutlineMailOutline />
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Enter your phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <span className="input-group-text bg-white">
                        <FaPhoneAlt />
                      </span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Choose a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span className="input-group-text bg-white">
                        <RiLock2Fill />
                      </span>
                    </div>
                  </div>

                  <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-lg" style={gradientBtn}>
                      Create account
                    </button>
                  </div>

                  <div className="text-center">
                    <small className="text-muted">Already have an account? </small>
                    <Link to="/login" className="ms-2 fw-semibold" style={{ color: "#0d6efd" }}>
                      Login Now
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuizPopup />
    </>
  );
};

export default Register;
