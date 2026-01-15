import {
  getCurrentUser,
  isAuthenticated,
  toggleSavedJob,
  isJobSaved,
  applyToJob,
  hasAppliedToJob,
  buildSignInUrlWithNext,
  getCustomJobs,
  getCompanyAverageRating,
  getInterviewTips,
  getProfile,
  getResume,
  applyWithProfile,
  trackJobView,
  isJobseeker,
  isEmployer,
  isAdmin
} from "/js/auth.js";

async function loadData() {
  const res = await fetch("/data/data.json");
  return res.json();
}

function getJobIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderNotFound() {
  const wrap = document.getElementById("jobWrap");
  wrap.innerHTML = `
    <div class="p-4 rounded-4" style="background: #f5f5f5">
      <h4 class="mb-2" style="font-weight: 600">Job not found</h4>
      <p class="mb-0">The job you are looking for does not exist.</p>
    </div>
  `;
}

function renderJob({ job, company, user }) {
  const saved = user ? isJobSaved(job.id) : false;
  const applied = user ? hasAppliedToJob(job.id) : false;

  const canApply = !user || isJobseeker(user) || isAdmin(user);

  const { average: companyRating, count: reviewCount } = company
    ? getCompanyAverageRating(company.id)
    : { average: 0, count: 0 };

  const ratingHtml =
    reviewCount > 0
      ? `
    <span class="company-rating">
      <i class="fa-solid fa-star"></i>
      <span class="rating-value">${companyRating.toFixed(1)}</span>
      <span class="rating-count">(${reviewCount} reviews)</span>
    </span>
  `
      : "";

  let applyButtonHtml = "";
  if (applied) {
    applyButtonHtml = `<button class="btn btn-signup" disabled>Applied</button>`;
  } else if (!canApply) {
    applyButtonHtml = `<button class="btn btn-signup" disabled title="Employers cannot apply to jobs">Employer Account</button>`;
  } else {
    applyButtonHtml = `
      <div class="dropdown">
        <button id="applyBtn" class="btn btn-signup dropdown-toggle" data-bs-toggle="dropdown">
          Apply Now
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#" id="quickApplyBtn"><i class="fa-solid fa-bolt me-2"></i>Quick Apply</a></li>
          <li><a class="dropdown-item" href="#" id="applyProfileBtn"><i class="fa-solid fa-user me-2"></i>Apply with Profile</a></li>
        </ul>
      </div>
    `;
  }

  const wrap = document.getElementById("jobWrap");
  wrap.innerHTML = `
    <div class="job-detail-shell">
      <div class="job-detail-card">
        <div class="job-detail-header">
          <div class="job-detail-brand">
            <div class="job-company-logo">
              ${
                company?.logo
                  ? `<img src="/${company.logo}" alt="${company.name} Logo">`
                  : `<i class="fa-solid fa-building" style="font-size: 28px; color: #ccc;"></i>`
              }
            </div>

            <div class="job-detail-title">
              <span class="badge badge-accent mb-2 px-3 py-2 rounded-pill">
                ${company?.name || ""}${ratingHtml}
              </span>
              <h2>${job.title}</h2>
              <div class="job-detail-meta">
                <span class="job-meta-chip"><i class="fa-solid fa-briefcase"></i> ${
                  job.type
                }</span>
                <span class="job-meta-chip"><i class="fa-solid fa-layer-group"></i> ${
                  job.category
                }</span>
                <span class="job-meta-chip"><i class="fa-solid fa-location-dot"></i> ${
                  job.location || company?.location || ""
                }</span>
                <span class="job-meta-chip"><i class="fa-solid fa-calendar"></i> ${
                  job.postedDate || "Recently"
                }</span>
              </div>
            </div>
          </div>

          <div class="job-detail-actions">
            <button id="saveBtn" class="save-btn ${saved ? "saved" : ""}">
              ${saved ? "Saved" : "Save"} <i class="fa-${
    saved ? "solid" : "regular"
  } fa-bookmark"></i>
            </button>
            ${applyButtonHtml}
          </div>
        </div>

        <div class="row g-4 job-detail-body">
          <div class="col-lg-8">
            <div class="job-detail-section">
              <h4><i class="fa-solid fa-file-lines"></i> Job Description</h4>
              <p>${job.description || "No description available."}</p>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="job-overview">
              <h5>Job Overview</h5>
              <div class="job-overview-row">
                <span>Salary</span>
                <strong>${job.salary || "Not specified"}</strong>
              </div>
              <div class="job-overview-row">
                <span>Experience</span>
                <strong>${job.experience || "Not specified"}</strong>
              </div>
              <div class="job-overview-row">
                <span>Job Type</span>
                <strong>${job.type || "Not specified"}</strong>
              </div>
              <div class="job-overview-row">
                <span>Category</span>
                <strong>${job.category || "Not specified"}</strong>
              </div>
              <div class="job-overview-row">
                <span>Location</span>
                <strong>${
                  job.location || company?.location || "Not specified"
                }</strong>
              </div>
              ${
                company
                  ? `
                <div class="job-overview-row">
                  <span>Company</span>
                  <a href="/company.html?id=${company.id}" style="color: #b71c1c; font-weight: 500;">
                    ${company.name} <i class="fa-solid fa-external-link" style="font-size: 0.8em;"></i>
                  </a>
                </div>
              `
                  : ""
              }
              <hr class="my-3" />
              <a href="/jobs.html" class="btn btn-outline-red w-100">Browse more jobs</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  trackJobView(job.id);

  renderInterviewTips(job.category);

  document.getElementById("saveBtn").addEventListener("click", () => {
    if (!isAuthenticated()) {
      window.location.href = buildSignInUrlWithNext(
        window.location.pathname + window.location.search
      );
      return;
    }

    toggleSavedJob(job.id);
    const nextSaved = isJobSaved(job.id);
    const btn = document.getElementById("saveBtn");
    btn.classList.toggle("saved", nextSaved);
    btn.innerHTML = `${nextSaved ? "Saved" : "Save"} <i class="fa-${
      nextSaved ? "solid" : "regular"
    } fa-bookmark"></i>`;
  });

  if (!applied && canApply) {
    document.getElementById("quickApplyBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isAuthenticated()) {
        window.location.href = buildSignInUrlWithNext(
          window.location.pathname + window.location.search
        );
        return;
      }
      applyToJob(job.id);
      location.reload();
    });

    document
      .getElementById("applyProfileBtn")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        if (!isAuthenticated()) {
          window.location.href = buildSignInUrlWithNext(
            window.location.pathname + window.location.search
          );
          return;
        }
        showApplyProfileModal(job, company);
      });
  }
}

function renderInterviewTips(category) {
  const tips = getInterviewTips(category);
  const container = document.getElementById("interviewTips");

  if (!tips || !tips.length) return;

  container.classList.remove("d-none");
  container.innerHTML = `
    <div class="interview-tips">
      <h5><i class="fa-solid fa-lightbulb me-2"></i>Interview Tips for ${
        category || "This Role"
      }</h5>
      <ul>
        ${tips
          .map(
            (tip) => `
          <li>
            <i class="fa-solid fa-check-circle"></i>
            <span>${tip}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;
}

function showApplyProfileModal(job, company) {
  const modal = new bootstrap.Modal(
    document.getElementById("applyProfileModal")
  );
  const body = document.getElementById("applyModalBody");
  const footer = document.getElementById("applyModalFooter");
  const user = getCurrentUser();
  const profile = getProfile();
  const resume = getResume();

  body.innerHTML = `
    <p class="text-muted mb-3">Your profile information will be shared with ${
      company?.name || "the employer"
    }:</p>
    <div class="profile-preview">
      <div class="profile-preview-item">
        <i class="fa-solid fa-user"></i>
        <span class="label">Name</span>
        <span class="value ${!user?.fullName ? "profile-missing" : ""}">${
    user?.fullName || "Not set"
  }</span>
      </div>
      <div class="profile-preview-item">
        <i class="fa-solid fa-envelope"></i>
        <span class="label">Email</span>
        <span class="value ${!user?.email ? "profile-missing" : ""}">${
    user?.email || "Not set"
  }</span>
      </div>
      <div class="profile-preview-item">
        <i class="fa-solid fa-phone"></i>
        <span class="label">Phone</span>
        <span class="value ${!profile?.phone ? "profile-missing" : ""}">${
    profile?.phone || "Not set"
  }</span>
      </div>
      <div class="profile-preview-item">
        <i class="fa-solid fa-location-dot"></i>
        <span class="label">Location</span>
        <span class="value ${!profile?.location ? "profile-missing" : ""}">${
    profile?.location || "Not set"
  }</span>
      </div>
      <div class="profile-preview-item">
        <i class="fa-solid fa-file-pdf"></i>
        <span class="label">Resume</span>
        <span class="value ${!resume ? "profile-missing" : ""}">${
    resume
      ? `${resume.name} (${(resume.size / 1024).toFixed(1)} KB)`
      : "Not uploaded"
  }</span>
      </div>
    </div>
    <div class="mb-3">
      <label for="coverLetterText" class="form-label">Cover Letter (optional)</label>
      <textarea class="form-control" id="coverLetterText" rows="4" placeholder="Write a brief cover letter..."></textarea>
    </div>
    <div class="form-check">
      <input type="checkbox" class="form-check-input" id="includeResume" ${
        resume ? "checked" : "disabled"
      }>
      <label class="form-check-label" for="includeResume">Include my resume with this application</label>
    </div>
    ${
      !profile?.phone || !profile?.location
        ? `
      <div class="alert alert-warning mt-3 mb-0" style="font-size: 0.9rem;">
        <i class="fa-solid fa-exclamation-triangle me-2"></i>
        Some profile fields are missing. <a href="/dashboard/profile.html" class="alert-link">Complete your profile</a> for better chances.
      </div>
    `
        : ""
    }
  `;

  footer.innerHTML = `
    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
    <button type="button" class="btn btn-signup" id="confirmApplyBtn">Submit Application</button>
  `;

  document.getElementById("confirmApplyBtn").addEventListener("click", () => {
    const coverLetter = document.getElementById("coverLetterText").value;
    const useResume = document.getElementById("includeResume").checked;

    const result = applyWithProfile(job.id, { coverLetter, useResume });

    if (result.ok) {
      body.innerHTML = `
        <div class="apply-success">
          <i class="fa-solid fa-circle-check"></i>
          <h4>Application Submitted!</h4>
          <p class="text-muted">Your application for <strong>${
            job.title
          }</strong> at <strong>${
        company?.name || ""
      }</strong> has been submitted successfully.</p>
          <a href="/dashboard/applied.html" class="btn btn-outline-red mt-2">View My Applications</a>
        </div>
      `;
      footer.innerHTML = `
        <button type="button" class="btn btn-signup" data-bs-dismiss="modal">Close</button>
      `;
    } else {
      alert(result.message || "Failed to submit application");
    }
  });

  modal.show();
}

async function init() {
  const jobId = getJobIdFromUrl();
  if (!jobId) {
    renderNotFound();
    return;
  }

  const user = getCurrentUser();
  const data = await loadData();
  const customJobs = getCustomJobs();
  const jobs = [...(data.jobs || []), ...customJobs];

  const job = jobs.find((j) => String(j.id) === String(jobId));
  if (!job) {
    renderNotFound();
    return;
  }

  const company = (data.companies || []).find((c) => c.id === job.companyId);
  renderJob({ job, company, user });
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => console.error(err));
});
