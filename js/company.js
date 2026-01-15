async function init() {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("id");

  if (!companyId) {
    window.location.href = "/companies.html";
    return;
  }

  const res = await fetch("/data/data.json");
  const data = await res.json();

  const company = (data.companies || []).find(
    (c) => String(c.id) === companyId
  );
  if (!company) {
    window.location.href = "/companies.html";
    return;
  }

  document.title = `${company.name} - JobPortal`;

  const profileEl = document.getElementById("companyProfile");
  const jobsListEl = document.getElementById("jobsList");
  const noJobsEl = document.getElementById("noJobs");

  const companyJobs = (data.jobs || []).filter(
    (j) => j.companyId === company.id
  );

  profileEl.innerHTML = `
    <div class="company-profile-card">
      <div class="company-profile-header">
        <div class="company-profile-logo">
          ${
            company.logo
              ? `<img src="/${company.logo}" alt="${company.name} Logo">`
              : ""
          }
        </div>
        <div class="company-profile-info">
          <h1 class="company-profile-name">${company.name}</h1>
          <p class="company-profile-location">
            <i class="fa-solid fa-location-dot"></i> ${company.location}
          </p>
        </div>
      </div>
      <div class="company-profile-stats">
        <div class="company-stat">
          <span class="company-stat-value">${companyJobs.length}</span>
          <span class="company-stat-label">Open Jobs</span>
        </div>
        <div class="company-stat">
          <span class="company-stat-value">${
            company.location.split(",")[0]
          }</span>
          <span class="company-stat-label">Location</span>
        </div>
      </div>
      <p class="company-profile-desc">
        ${
          company.description ||
          `${company.name} is a leading company based in ${company.location}, offering great opportunities in various fields.`
        }
      </p>
      <a class="btn btn-signup btn-md" href="${
        company.website
      }" target="_blank" rel="noreferrer">
        <i class="fa-solid fa-globe"></i> Visit Website
      </a>
    </div>
  `;

  if (companyJobs.length === 0) {
    jobsListEl.classList.add("d-none");
    noJobsEl.classList.remove("d-none");
    return;
  }

  jobsListEl.innerHTML = companyJobs
    .map(
      (job) => `
      <div class="col-md-6 col-lg-4">
        <a href="/job.html?id=${job.id}" class="job-card-link">
          <div class="job-card">
            <div>
              <div class="job-top">
                <div class="company-logo" style="width: 48px; height: 48px;">
                  ${
                    company.logo
                      ? `<img src="/${company.logo}" alt="${company.name} Logo">`
                      : ""
                  }
                </div>
              </div>
              <h6 class="company-name">${company.name}</h6>
              <h5 class="job-title">${job.title}</h5>
              <div class="job-tags">
                <span>${job.type}</span>
                <span>${job.category}</span>
              </div>
            </div>
            <div class="job-footer">
              <div>
                <strong>${job.salary || ""}</strong>
                <small>${job.location}</small>
              </div>
              <span class="btn-apply">View</span>
            </div>
          </div>
        </a>
      </div>
    `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => console.error(err));
});
