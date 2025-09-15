import React, { useContext } from "react";
import { Context } from "/src/context.jsx";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { RiInstagramFill } from "react-icons/ri";

function Footer() {
  const { isAuthorized } = useContext(Context);

  if (!isAuthorized) return null;

  return (
    <footer
      style={{
        background: "linear-gradient(90deg, #0d6efd, #2b8ecc)",
        color: "#fff",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.1)",
        padding: "8px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.4px",
          }}
        >
          Project by <strong>Keshav</strong>, <strong>Garima</strong>,{" "}
          <strong>Charan</strong>, <strong>Sindhura</strong>
        </p>

        <div style={{ display: "flex", gap: "16px", fontSize: "20px" }}>
          <Link
            to={"/"}
            target="_blank"
            aria-label="GitHub"
            style={{ color: "#fff", transition: "0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f1f1f1")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <FaGithub />
          </Link>

          <Link
            to={"/"}
            target="_blank"
            aria-label="LeetCode"
            style={{ color: "#fff", transition: "0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f1f1f1")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <SiLeetcode />
          </Link>

          <Link
            to={"/"}
            target="_blank"
            aria-label="LinkedIn"
            style={{ color: "#fff", transition: "0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f1f1f1")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <FaLinkedin />
          </Link>

          <Link
            to={"/"}
            target="_blank"
            aria-label="Instagram"
            style={{ color: "#fff", transition: "0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f1f1f1")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
          >
            <RiInstagramFill />
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
