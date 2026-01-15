import {
  getCurrentUser,
  isAuthenticated,
  toggleSavedJob,
  isJobSaved,
  applyToJob,
  hasAppliedToJob,
  buildSignInUrlWithNext,
  getCustomJobs,
  isEmployer
} from "/js/auth.js";

let allJobs = [];
let allCompanies = [];
let filteredJobs = [];

async function loadData() {
  const res = await fetch("/data/data.json");
  return res.json();
}

function getJobUrl(jobId) {
  return `/job.html?id=${encodeURIComponent(jobId)}`;
}

function wireCardNavigation(container) {
  container.querySelectorAll("[data-job-card]").forEach((card) => {
    card.addEventListener("click", (e) => {
      const t = e.target;
      if (
        t &&
        (t.closest("button") ||
          t.closest("a") ||
          t.closest("input") ||
          t.closest("textarea"))
      )
        return;
      const jobId = card.getAttribute("data-job-card");
      if (!jobId) return;
      window.location.href = getJobUrl(jobId);
    });
  });
}

function renderJobCard({ job, company, user }) {
  const saved = user ? isJobSaved(job.id) : false;
  const applied = user ? hasAppliedToJob(job.id) : false;
  const isUserEmployer = user ? isEmployer(user) : false;

  let applyBtnHtml;
  if (applied) {
    applyBtnHtml = `<button class="btn-apply" disabled>Applied</button>`;
  } else if (isUserEmployer) {
    applyBtnHtml = `<button class="btn-apply" disabled title="Employers cannot apply">Employer</button>`;
  } else {
    applyBtnHtml = `<button class="btn-apply" data-apply="${job.id}">Apply now</button>`;
  }

  return `
    <div class="col-lg-4 col-md-6">
      <div class="job-card" data-job-card="${job.id}">
        <div>
          <div class="job-top">
            <div class="company-logo">
              ${
                company?.logo
                  ? `<img src="/${company.logo}" alt="${company.name} Logo">`
                  : ""
              }
            </div>
            <button class="save-btn ${saved ? "saved" : ""}" data-save="${
    job.id
  }">
              ${saved ? "Saved" : "Save"} <i class="fa-${
    saved ? "solid" : "regular"
  } fa-bookmark"></i>
            </button>
          </div>

          <h6 class="company-name">${company?.name || ""}</h6>
          <a href="${getJobUrl(
            job.id
          )}" class="text-decoration-none" style="color: inherit">
            <h5 class="job-title">${job.title}</h5>
          </a>

          <div class="job-tags">
            <span>${job.type}</span>
            <span>${job.category}</span>
          </div>
        </div>

        <div class="job-footer">
          <div>
            <strong>${job.salary}</strong>
            <small>${company?.location || job.location || ""}</small>
          </div>
          ${applyBtnHtml}
        </div>
      </div>
    </div>
  `;
}

function wireActions({ container, jobsById }) {
  container.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAuthenticated()) {
        window.location.href = buildSignInUrlWithNext(
          window.location.pathname + window.location.search
        );
        return;
      }

      const jobId = btn.getAttribute("data-save");
      toggleSavedJob(jobId);
      const saved = isJobSaved(jobId);
      btn.classList.toggle("saved", saved);
      btn.innerHTML = `${saved ? "Saved" : "Save"} <i class="fa-${
        saved ? "solid" : "regular"
      } fa-bookmark"></i>`;
    });
  });

  container.querySelectorAll("[data-apply]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const jobId = btn.getAttribute("data-apply");

      if (!isAuthenticated()) {
        window.location.href = buildSignInUrlWithNext(getJobUrl(jobId));
        return;
      }

      const user = getCurrentUser();
      if (user && isEmployer(user)) {
        alert("Employers cannot apply to jobs");
        return;
      }

      const job = jobsById.get(String(jobId));
      if (!job) return;

      const result = applyToJob(jobId);
      if (result.ok) {
        btn.textContent = "Applied";
        btn.disabled = true;
      } else {
        alert(result.message || "Failed to apply");
      }
    });
  });
}

function getPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("page");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function setPageInUrl(page) {
  const params = new URLSearchParams(window.location.search);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const next = `${window.location.pathname}?${params.toString()}`.replace(
    /\?$/,
    ""
  );
  window.history.pushState({}, "", next);
}

function renderPagination({ totalItems, pageSize, currentPage }) {
  const host = document.getElementById("jobsPagination");
  if (!host) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clamped = Math.min(Math.max(1, currentPage), totalPages);

  if (totalPages <= 1) {
    host.innerHTML = "";
    return;
  }

  const maxButtons = 7;
  let start = Math.max(1, clamped - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pages = [];
  for (let p = start; p <= end; p += 1) pages.push(p);

  host.innerHTML = `
    <nav aria-label="Jobs pagination">
      <ul class="pagination mb-0">
        <li class="page-item ${clamped === 1 ? "disabled" : ""}">
          <a class="page-link" href="#" data-page="${clamped - 1}">Previous</a>
        </li>
        ${pages
          .map(
            (p) => `
              <li class="page-item ${p === clamped ? "active" : ""}">
                <a class="page-link" href="#" data-page="${p}">${p}</a>
              </li>
            `
          )
          .join("")}
        <li class="page-item ${clamped === totalPages ? "disabled" : ""}">
          <a class="page-link" href="#" data-page="${clamped + 1}">Next</a>
        </li>
      </ul>
    </nav>
  `;

  host.querySelectorAll("[data-page]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const nextPage = Number(a.getAttribute("data-page"));
      if (!Number.isFinite(nextPage)) return;
      if (nextPage < 1 || nextPage > totalPages) return;
      setPageInUrl(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.dispatchEvent(new Event("jobs:pagechange"));
    });
  });
}

function populateFilters() {
  const locationSelect = document.getElementById("filterLocation");
  const typeSelect = document.getElementById("filterType");
  const categorySelect = document.getElementById("filterCategory");

  const locations = [
    ...new Set(allCompanies.map((c) => c.location).filter(Boolean))
  ].sort();
  locations.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationSelect.appendChild(opt);
  });

  const types = [...new Set(allJobs.map((j) => j.type).filter(Boolean))].sort();
  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  const categories = [
    ...new Set(allJobs.map((j) => j.category).filter(Boolean))
  ].sort();
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function applyFilters() {
  const searchTerm = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const locationFilter = document.getElementById("filterLocation").value;
  const typeFilter = document.getElementById("filterType").value;
  const categoryFilter = document.getElementById("filterCategory").value;

  filteredJobs = allJobs.filter((job) => {
    const company = allCompanies.find((c) => c.id === job.companyId);

    if (searchTerm) {
      const searchIn = `${job.title} ${job.description || ""} ${
        company?.name || ""
      }`.toLowerCase();
      if (!searchIn.includes(searchTerm)) return false;
    }

    if (locationFilter && company?.location !== locationFilter) return false;

    if (typeFilter && job.type !== typeFilter) return false;

    if (categoryFilter && job.category !== categoryFilter) return false;

    return true;
  });

  const resultsCount = document.getElementById("resultsCount");
  resultsCount.textContent = `${filteredJobs.length} job${
    filteredJobs.length !== 1 ? "s" : ""
  } found`;

  const emptyState = document.getElementById("emptyState");
  const jobsList = document.getElementById("jobsList");

  if (filteredJobs.length === 0) {
    emptyState.classList.remove("d-none");
    jobsList.classList.add("d-none");
  } else {
    emptyState.classList.add("d-none");
    jobsList.classList.remove("d-none");
  }

  setPageInUrl(1);
  document.dispatchEvent(new Event("jobs:pagechange"));
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterCategory").value = "";
  applyFilters();
}

async function init() {
  const user = getCurrentUser();

  const data = await loadData();
  const customJobs = getCustomJobs();

  allCompanies = data.companies || [];
  allJobs = [...(data.jobs || []), ...customJobs].sort(
    (a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0)
  );

  filteredJobs = [...allJobs];

  const jobsById = new Map(allJobs.map((j) => [String(j.id), j]));

  const jobsContainer = document.getElementById("jobsList");
  if (!jobsContainer) return;

  populateFilters();

  document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);
  document
    .getElementById("filterLocation")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterType")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterCategory")
    .addEventListener("change", applyFilters);
  document
    .getElementById("clearFilters")
    .addEventListener("click", clearFilters);
  document
    .getElementById("emptyStateClear")
    .addEventListener("click", clearFilters);

  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get("category");
  if (urlCategory) {
    document.getElementById("filterCategory").value = urlCategory;
    applyFilters();
  }

  document.getElementById("resultsCount").textContent = `${
    filteredJobs.length
  } job${filteredJobs.length !== 1 ? "s" : ""} found`;

  const pageSize = 9;

  async function renderPage() {
    const page = getPageFromUrl();
    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;
    const slice = filteredJobs.slice(start, start + pageSize);

    jobsContainer.innerHTML = slice
      .map((job) => {
        const company = allCompanies.find((c) => c.id === job.companyId);
        return renderJobCard({ job, company, user });
      })
      .join("");

    wireActions({ container: jobsContainer, jobsById });
    wireCardNavigation(jobsContainer);
    renderPagination({
      totalItems: filteredJobs.length,
      pageSize,
      currentPage
    });
  }

  document.addEventListener("jobs:pagechange", () => {
    renderPage().catch((err) => console.error(err));
  });

  window.addEventListener("popstate", () => {
    renderPage().catch((err) => console.error(err));
  });

  await renderPage();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => console.error(err));
});
