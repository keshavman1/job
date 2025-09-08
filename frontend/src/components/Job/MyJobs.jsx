import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { Context } from "/src/context.jsx";
import { useNavigate } from "react-router-dom";

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingMode, setEditingMode] = useState(null);
  const { isAuthorized, user } = useContext(Context);

  const navigateTo = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/job/getmyjobs",
          { withCredentials: true }
        );
        setMyJobs(data.myJobs || []);
      } catch (error) {
        const msg = error?.response?.data?.message || error.message || "Failed to fetch";
        toast.error(msg);
        setMyJobs([]);
      }
    };
    fetchJobs();
  }, []);

  if (!isAuthorized || (user && user.role !== "Employer")) {
    navigateTo("/");
  }

  const handleEnableEdit = (jobId) => {
    setEditingMode(jobId);
  };

  const handleDisableEdit = () => {
    setEditingMode(null);
  };

  const handleUpdateJob = async (jobId) => {
    try {
      const updatedJob = myJobs.find((job) => job._id === jobId);
      if (!updatedJob) return;

      // Clone and normalize skills: accept array or comma-string
      const payload = { ...updatedJob };
      if (typeof payload.skills === "string") {
        payload.skills = payload.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(payload.skills)) {
        payload.skills = payload.skills.map((s) => String(s).trim()).filter(Boolean);
      } else {
        payload.skills = [];
      }

      await axios.put(`http://localhost:4000/api/v1/job/update/${jobId}`, payload, {
        withCredentials: true,
      });
      toast.success("Job Updated!");
      setEditingMode(null);

      // Update local state to reflect normalized skills (join into array)
      setMyJobs(prev =>
        prev.map(j => j._id === jobId ? { ...j, skills: payload.skills } : j)
      );
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || "Update failed";
      toast.error(msg);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`http://localhost:4000/api/v1/job/delete/${jobId}`, {
        withCredentials: true,
      });
      toast.success("Job Deleted!");
      setMyJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(msg);
    }
  };

  const handleInputChange = (jobId, field, value) => {
    setMyJobs((prevJobs) =>
      prevJobs.map((job) =>
        job._id === jobId ? { ...job, [field]: value } : job
      )
    );
  };

  return (
    <>
      <div className="myJobs page">
        <div className="container">
          <h1>Your Posted Jobs</h1>
          {myJobs.length > 0 ? (
            <>
              <div className="banner">
                {myJobs.map((element) => (
                  <div className="card" key={element._id}>
                    <div className="content">
                      <div className="short_fields">
                        <div>
                          <span>Title:</span>
                          <input
                            type="text"
                            disabled={editingMode !== element._id}
                            value={element.title || ""}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "title",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <span>Country:</span>
                          <input
                            type="text"
                            disabled={editingMode !== element._id}
                            value={element.country || ""}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "country",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <span>City:</span>
                          <input
                            type="text"
                            disabled={editingMode !== element._id}
                            value={element.city || ""}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "city",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <span>Category:</span>
                          <select
                            value={element.category || ""}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "category",
                                e.target.value
                              )
                            }
                            disabled={editingMode !== element._id}
                          >
                            <option value="Graphics & Design">Graphics & Design</option>
                            <option value="Mobile App Development">Mobile App Development</option>
                            <option value="Frontend Web Development">Frontend Web Development</option>
                            <option value="MERN Stack Development">MERN STACK Development</option>
                            <option value="Account & Finance">Account & Finance</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="Video Animation">Video Animation</option>
                            <option value="MEAN Stack Development">MEAN STACK Development</option>
                            <option value="MEVN Stack Development">MEVN STACK Development</option>
                            <option value="Data Entry Operator">Data Entry Operator</option>
                          </select>
                        </div>

                        <div>
                          <span>Salary:</span>
                          {element.fixedSalary ? (
                            <input
                              type="number"
                              disabled={editingMode !== element._id}
                              value={element.fixedSalary || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  element._id,
                                  "fixedSalary",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <div>
                              <input
                                type="number"
                                disabled={editingMode !== element._id}
                                value={element.salaryFrom || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    element._id,
                                    "salaryFrom",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="number"
                                disabled={editingMode !== element._id}
                                value={element.salaryTo || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    element._id,
                                    "salaryTo",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <span>Expired:</span>
                          <select
                            value={String(element.expired)}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "expired",
                                e.target.value === "true"
                              )
                            }
                            disabled={editingMode !== element._id}
                          >
                            <option value={true}>TRUE</option>
                            <option value={false}>FALSE</option>
                          </select>
                        </div>

                        {/* NEW: Skills input (comma-separated). If editing, show string; otherwise show display */}
                        <div>
                          <span>Skills:</span>
                          <input
                            type="text"
                            disabled={editingMode !== element._id}
                            value={
                              editingMode === element._id
                                ? (Array.isArray(element.skills) ? element.skills.join(", ") : (element.skills || ""))
                                : (Array.isArray(element.skills) ? element.skills.join(", ") : (element.skills || ""))
                            }
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "skills",
                                e.target.value
                              )
                            }
                            placeholder="Comma separated (e.g. React, Node.js)"
                          />
                        </div>
                      </div>

                      <div className="long_field">
                        <div>
                          <span>Description:</span>
                          <textarea
                            rows={5}
                            value={element.description || ""}
                            disabled={editingMode !== element._id}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <span>Location: </span>
                          <textarea
                            value={element.location || ""}
                            rows={5}
                            disabled={editingMode !== element._id}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "location",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="button_wrapper">
                      <div className="edit_btn_wrapper">
                        {editingMode === element._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateJob(element._id)}
                              className="check_btn"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleDisableEdit()}
                              className="cross_btn"
                            >
                              <RxCross2 />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnableEdit(element._id)}
                            className="edit_btn"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteJob(element._id)}
                        className="delete_btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>You've not posted any job or may be you deleted all of your jobs!</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MyJobs;
