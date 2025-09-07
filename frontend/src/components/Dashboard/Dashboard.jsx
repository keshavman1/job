// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "/src/context.jsx";
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

export default function Dashboard() {
  const { user, setUser } = useContext(Context);

  const [about, setAbout] = useState(user?.about || "");
  const [editingAbout, setEditingAbout] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // resume/photo file states (hold chosen file until user clicks Save)
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const resumeRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchRequests = async () => {
      try {
        setLoadingRequests(true);
        const res = await axios.get(`${API_BASE}/connections/requests`, { withCredentials: true });
        if (!mounted) return;
        setRequests(res.data?.requests || []);
      } catch (err) {
        console.warn("Failed to load requests", err);
        setRequests([]);
      } finally {
        if (mounted) setLoadingRequests(false);
      }
    };
    fetchRequests();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAcceptDecline = async (connId, action) => {
    try {
      const res = await axios.put(
        `${API_BASE}/connections/respond/${connId}`,
        { action },
        { withCredentials: true }
      );
      toast.success(res.data?.connection?.status === "accepted" ? "Request accepted" : "Request declined");
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(connId)));
    } catch (err) {
      console.error("Respond request failed", err);
      toast.error(err?.response?.data?.message || "Failed to respond");
    }
  };

  const handleAboutSave = () => {
    setUser((prev) => ({ ...(prev || {}), about }));
    setEditingAbout(false);
    toast.success("About updated (UI only)");
  };

  // ------ Resume upload flow ------
  const onResumeChosen = (e) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
  };

  const saveResume = async () => {
    if (!resumeFile) return toast.error("No file selected");
    setUploadingResume(true);
    try {
      const form = new FormData();
      form.append("resume", resumeFile);

      // Backend endpoint expected to accept multipart/form-data
      const res = await axios.post(`${API_BASE}/profile/upload/resume`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Server should save file to uploads/resumes. Show success.
      toast.success(res.data?.message || "Resume uploaded");
      setResumeFile(null);
      if (resumeRef.current) resumeRef.current.value = "";
      // Optionally update user with returned path if backend returns it
      if (res.data?.user) setUser(res.data.user);
    } catch (err) {
      console.error("Resume upload failed", err);
      toast.error(err?.response?.data?.message || "Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  // ------ Photo upload flow ------
  const onPhotoChosen = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
  };

  const savePhoto = async () => {
    if (!photoFile) return toast.error("No file selected");
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("photo", photoFile);

      // Backend endpoint expected to accept multipart/form-data and return new profile image path
      const res = await axios.post(`${API_BASE}/profile/upload/photo`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data?.message || "Profile photo uploaded");

      // if server returns the new photo path in res.data.profilePhotoPath or res.data.user
      if (res.data?.profilePhotoPath) {
        setUser((prev) => ({ ...(prev || {}), profilePhotoPath: res.data.profilePhotoPath }));
      } else if (res.data?.user) {
        setUser(res.data.user);
      } else {
        // optimistic: attempt to show preview using object URL
        // (This will only be a temporary preview; server image path is preferred.)
        const previewUrl = URL.createObjectURL(photoFile);
        setUser((prev) => ({ ...(prev || {}), profilePhotoPath: previewUrl }));
      }

      setPhotoFile(null);
      if (photoRef.current) photoRef.current.value = "";
    } catch (err) {
      console.error("Photo upload failed", err);
      toast.error(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-inner">
        {/* LEFT MAIN */}
        <div className="dashboard-main">
          <section className="profile-card">
            <div className="profile-left">
              <div className="avatar">
                {user?.profilePhotoPath ? (
                  // If profilePhotoPath is absolute or relative URL it will render
                  <img src={user.profilePhotoPath} alt={user.name} />
                ) : (
                  <div className="avatar-initial">{(user?.name || "U").charAt(0).toUpperCase()}</div>
                )}
              </div>
            </div>

            <div className="profile-center">
              <h2 className="profile-name">{user?.name || "Your Name"}</h2>
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <strong>Email:</strong>
                  <span className="muted">{user?.email || "—"}</span>
                </div>
                <div className="profile-info-item">
                  <strong>Phone:</strong>
                  <span className="muted">{user?.phone || "—"}</span>
                </div>
                <div className="profile-info-item">
                  <strong>Role:</strong>
                  <span className="muted">{user?.role || "—"}</span>
                </div>
              </div>
            </div>

            <div className="profile-right">
              <button
                className="btn-outline"
                onClick={() => window.open(`/profile/${user?._id || ""}`, "_blank")}
              >
                View Your Public Profile
              </button>
            </div>
          </section>

          <section className="card about-card">
            <div className="card-header">
              <h3>About Me</h3>
              <div>
                {!editingAbout ? (
                  <button className="btn-link" onClick={() => setEditingAbout(true)}>
                    Edit
                  </button>
                ) : (
                  <button className="btn-link" onClick={handleAboutSave}>
                    Save
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!editingAbout ? (
                <p className="about-text">{about || <span className="muted">Tell others about yourself...</span>}</p>
              ) : (
                <textarea className="about-input" value={about} onChange={(e) => setAbout(e.target.value)} />
              )}
            </div>
          </section>

          <section className="two-column">
            {/* Resume card */}
            <div className="card resume-card">
              <div className="card-header">
                <h3>Resume</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <input
                    ref={resumeRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={onResumeChosen}
                  />
                  {/* Show Save only when a file is selected */}
                  {resumeFile ? (
                    <button
                      onClick={saveResume}
                      disabled={uploadingResume}
                      className="btn-primary"
                    >
                      {uploadingResume ? "Saving..." : "Save"}
                    </button>
                  ) : (
                    <div className="muted small">PDF or DOCX recommended</div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo card */}
            <div className="card photo-card">
              <div className="card-header">
                <h3>Profile Photo</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChosen}
                  />
                  {photoFile ? (
                    <button
                      onClick={savePhoto}
                      disabled={uploadingPhoto}
                      className="btn-primary"
                    >
                      {uploadingPhoto ? "Saving..." : "Save"}
                    </button>
                  ) : (
                    <div className="muted small">Square image recommended</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="dashboard-sidebar">
          <section className="card connection-card">
            <div className="card-header">
              <h3>Connection Requests</h3>
              <div className="header-sub">People who want to connect with you</div>
            </div>

            <div className="card-body">
              {loadingRequests ? (
                <div className="muted">Loading connection requests...</div>
              ) : requests.length === 0 ? (
                <div className="muted">No pending connection requests</div>
              ) : (
                <ul className="requests-list">
                  {requests.map((r) => (
                    <li key={r._id} className="request-item">
                      <div className="request-left">
                        <div className="req-avatar">
                          {r.requester?.profilePhotoPath ? (
                            <img src={r.requester.profilePhotoPath} alt={r.requester.name} />
                          ) : (
                            <div className="req-initial">{(r.requester?.name || "U").charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <div>
                          <div className="req-name">{r.requester?.name}</div>
                          <div className="muted small">{r.requester?.role || ""}</div>
                        </div>
                      </div>

                      <div className="request-actions">
                        <button className="btn-accept" onClick={() => handleAcceptDecline(r._id, "accept")}>
                          Accept
                        </button>
                        <button className="btn-decline" onClick={() => handleAcceptDecline(r._id, "decline")}>
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
