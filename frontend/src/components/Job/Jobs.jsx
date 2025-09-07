import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "/src/context.jsx";

const API_BASE = "http://localhost:4000/api/v1";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const skills = params.get("skills");
        const url = `${API_BASE}/job/getall${skills ? `?skills=${encodeURIComponent(skills)}` : ""}`;
        const res = await axios.get(url, { withCredentials: true });
        // res.data.jobs expected structure from backend
        setJobs(res.data.jobs || []);
      } catch (error) {
        console.log(error);
      }
    };
    load();
  }, []);

  if (!isAuthorized) {
    navigateTo("/");
    return null;
  }

  return (
    <section className="jobs page">
      <div className="container">
        <h1>ALL AVAILABLE JOBS</h1>
        <div className="banner">
          {jobs.map((element) => (
            <div className="card" key={element._id}>
              <p>{element.title}</p>
              <p>{element.category}</p>
              <p>{element.country}</p>
              <Link to={`/job/${element._id}`}>Job Details</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Jobs;
