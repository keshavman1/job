// frontend/src/pages/MyApplications.jsx
import React, { useContext, useEffect, useState } from "react";
import { Context } from "/src/context.jsx";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/v1";
const API_ROOT = "http://localhost:4000";

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

  // helper to build absolute resume URL
  const getResumeUrl = (element) => {
    const candidate = element?.resume?.url || element?.resumePath || "";
    if (!candidate) return "";
    return candidate.startsWith("http") ? candidate : API_ROOT + candidate;
  };

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
                getResumeUrl={getResumeUrl}
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
              <EmployerCard element={element} key={element._id} openModal={openModal} getResumeUrl={getResumeUrl} />
            ))
          )}
        </div>
      )}
      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal, getResumeUrl }) => {
  const resumeUrl = getResumeUrl(element);
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
          // show thumbnail (image) when possible. If it's a PDF, the browser won't render as img — consider rendering a link for non-images
          /\.(jpe?g|png|webp|gif)$/i.test(resumeUrl) ? (
            <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} style={{ cursor: "pointer", maxWidth: 200 }} />
          ) : (
            <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", maxWidth: 200 }}>
              View Resume
            </a>
          )
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

const EmployerCard = ({ element, openModal, getResumeUrl }) => {
  const resumeUrl = getResumeUrl(element);
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
          /\.(jpe?g|png|webp|gif)$/i.test(resumeUrl) ? (
            <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} style={{ cursor: "pointer", maxWidth: 200 }} />
          ) : (
            <a href={resumeUrl} target="_blank" rel="noreferrer">
              View Resume
            </a>
          )
        ) : (
          "No resume"
        )}
      </div>
    </div>
  );
};

/* ResumeModal component */
const ResumeModal = ({ imageUrl, onClose }) => {
  return (
    <div className="resume-modal" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000
    }}>
      <div className="modal-content" style={{ position: "relative", width: "80%", maxWidth: 900, background: "#fff", padding: 20 }}>
        <span className="close" onClick={onClose} style={{ position: "absolute", top: 10, right: 14, fontSize: 28, cursor: "pointer" }}>
          &times;
        </span>
        {/* If it's an image, show it; otherwise open in new tab */}
        {/\.(jpe?g|png|webp|gif)$/i.test(imageUrl) ? (
          <img src={imageUrl} alt="resume" style={{ width: "100%", height: "auto" }} />
        ) : (
          <div style={{ textAlign: "center" }}>
            <a href={imageUrl} target="_blank" rel="noreferrer">Open resume in new tab</a>
          </div>
        )}
      </div>
    </div>
  );
};
