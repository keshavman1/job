import React, { useContext, useEffect, useState } from "react";
import { Context } from "/src/context.jsx";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const API_BASE = "http://localhost:4000/api/v1";

const MyApplications = () => {
  const { user, isAuthorized } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
      return;
    }

    const load = async () => {
      try {
        if (user && user.role === "Employer") {
          const res = await axios.get(`${API_BASE}/application/employer/getall`, {
            withCredentials: true,
          });
          setApplications(res.data.applications || []);
        } else {
          const res = await axios.get(`${API_BASE}/application/jobseeker/getall`, {
            withCredentials: true,
          });
          setApplications(res.data.applications || []);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Could not load");
      }
    };
    load();
  }, [isAuthorized, user, navigateTo]);

  const deleteApplication = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/application/delete/${id}`, {
        withCredentials: true,
      });
      toast.success(res.data.message);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <section className="my_applications page">
      {user && user.role === "Job Seeker" ? (
        <div className="container">
          <center>
            <h1>My Applications</h1>
          </center>
          {applications.length <= 0 ? (
            <center>
              <h4>No Applications Found</h4>
            </center>
          ) : (
            applications.map((element) => (
              <JobSeekerCard
                element={element}
                key={element._id}
                deleteApplication={deleteApplication}
                openModal={openModal}
              />
            ))
          )}
        </div>
      ) : (
        <div className="container">
          <center>
            <h1>Applications From Job Seekers</h1>
          </center>
          {applications.length <= 0 ? (
            <center>
              <h4>No Applications Found</h4>
            </center>
          ) : (
            applications.map((element) => (
              <EmployerCard element={element} key={element._id} openModal={openModal} />
            ))
          )}
        </div>
      )}
      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal }) => {
  const resumeUrl = element?.resume?.url || element?.resumePath || "";
  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
      </div>
      <div className="resume">
        {resumeUrl ? (
          <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} style={{ cursor: "pointer", maxWidth: 200 }} />
        ) : (
          <div>No resume</div>
        )}
      </div>
      <div className="btn_area">
        <button onClick={() => deleteApplication(element._id)}>Delete Application</button>
      </div>
    </div>
  );
};

const EmployerCard = ({ element, openModal }) => {
  const resumeUrl = element?.resume?.url || element?.resumePath || "";
  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
      </div>
      <div className="resume">
        {resumeUrl ? <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} style={{ cursor: "pointer", maxWidth: 200 }} /> : "No resume"}
      </div>
    </div>
  );
};
