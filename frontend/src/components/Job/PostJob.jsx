import React, { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Context } from "/src/context.jsx";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");
  // NEW: skills input (comma-separated)
  const [skillsInput, setSkillsInput] = useState("");

  const { isAuthorized, user } = useContext(Context);

  const navigateTo = useNavigate();

  // If not authorized or not Employer, redirect to home
  if (!isAuthorized || (user && user.role !== "Employer")) {
    navigateTo("/");
  }

  const handleJobPost = async (e) => {
    e.preventDefault();

    // Fix: ensure salary fields are reset appropriately
    if (salaryType === "Fixed Salary") {
      setSalaryFrom("");
      setSalaryTo("");
    } else if (salaryType === "Ranged Salary") {
      setFixedSalary("");
    } else {
      setSalaryFrom("");
      setSalaryTo("");
      setFixedSalary("");
    }

    // Normalize skills input into array of trimmed non-empty strings
    const skills = (typeof skillsInput === "string" && skillsInput.trim().length)
      ? skillsInput.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const payload = fixedSalary && String(fixedSalary).length >= 1
      ? {
          title,
          description,
          category,
          country,
          city,
          location,
          fixedSalary,
          skills,
        }
      : {
          title,
          description,
          category,
          country,
          city,
          location,
          salaryFrom,
          salaryTo,
          skills,
        };

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/job/post",
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(res.data.message || "Job Posted Successfully!");
      // Clear form
      setTitle("");
      setDescription("");
      setCategory("");
      setCountry("");
      setCity("");
      setLocation("");
      setSalaryFrom("");
      setSalaryTo("");
      setFixedSalary("");
      setSalaryType("default");
      setSkillsInput("");
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to post job";
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="job_post page">
        <div className="container">
          <h3>POST NEW JOB</h3>
          <form onSubmit={handleJobPost}>
            <div className="wrapper">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job Title"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Graphics & Design">Graphics & Design</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="Frontend Web Development">Frontend Web Development</option>
                <option value="Business Development Executive">Business Development Executive</option>
                <option value="Account & Finance">Account & Finance</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Video Animation">Video Animation</option>
                <option value="MEAN Stack Development">MEAN STACK Development</option>
                <option value="MERN Stack Development">MERN STACK Development</option>
                <option value="Data Entry Operator">Data Entry Operator</option>
              </select>
            </div>

            <div className="wrapper">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />

            <div className="salary_wrapper">
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
              >
                <option value="default">Select Salary Type</option>
                <option value="Fixed Salary">Fixed Salary</option>
                <option value="Ranged Salary">Ranged Salary</option>
              </select>
              <div>
                {salaryType === "default" ? (
                  <p>Please provide Salary Type *</p>
                ) : salaryType === "Fixed Salary" ? (
                  <input
                    type="number"
                    placeholder="Enter Fixed Salary"
                    value={fixedSalary}
                    onChange={(e) => setFixedSalary(e.target.value)}
                  />
                ) : (
                  <div className="ranged_salary">
                    <input
                      type="number"
                      placeholder="Salary From"
                      value={salaryFrom}
                      onChange={(e) => setSalaryFrom(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Salary To"
                      value={salaryTo}
                      onChange={(e) => setSalaryTo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <textarea
              rows="10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job Description"
            />

            {/* NEW: Skills input */}
            <div style={{ margin: "12px 0" }}>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Skills (comma separated) e.g. React, Node.js, MongoDB"
              />
              <small>Enter skills separated by commas. These are used for matching.</small>
            </div>

            <button type="submit">Create Job</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PostJob;
