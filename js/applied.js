import {
  requireAuth,
  signOut,
  getAppliedJobs,
  clearAppliedJobs,
  removeAppliedJob,
  getCustomJobs,
  getCurrentUser,
  getUserRole,
  USER_ROLES,
  setupRoleBasedSidebar
} from "/js/auth.js";

requireAuth({ redirectTo: "/signin.html" });
setupRoleBasedSidebar();

const user = getCurrentUser();
const role = getUserRole(user);
if (role === USER_ROLES.EMPLOYER) {
  alert("Employers cannot access job applications.");
  window.location.href = "/dashboard/index.html";
}

const emptyState = document.getElementById("emptyState");
const list = document.getElementById("appliedList");
const clearBtn = document.getElementById("clearBtn");

function getJobUrl(jobId) {
  return `/job.html?id=${encodeURIComponent(jobId)}`;
}

function getStatusBadge(status) {
  const statusConfig = {
    pending: { label: "Pending", class: "status-pending", icon: "fa-clock" },
    reviewed: { label: "Reviewed", class: "status-reviewed", icon: "fa-eye" },
    interview: {
      label: "Interview",
      class: "status-interview",
      icon: "fa-calendar-check"
    },
    rejected: {
      label: "Rejected",
      class: "status-rejected",
      icon: "fa-times-circle"
    },
    accepted: {
      label: "Accepted",
      class: "status-accepted",
      icon: "fa-check-circle"
    }
  };
  const config = statusConfig[status] || statusConfig.pending;
  return `<span class="application-status ${config.class}"><i class="fa-solid ${config.icon}"></i> ${config.label}</span>`;
}

async function loadAllJobs() {
  const res = await fetch("/data/data.json");
  const data = await res.json();
  const jobs = [...(data.jobs || []), ...getCustomJobs()];
  return { data, jobs };
}

async function render() {
  const applied = getAppliedJobs();
  if (!applied.length) {
    emptyState.classList.remove("d-none");
    list.classList.add("d-none");
    list.innerHTML = "";
    return;
  }

  const { data, jobs } = await loadAllJobs();
  const byId = new Map(jobs.map((j) => [String(j.id), j]));

  const cards = applied
    .map((a) => {
      const job = byId.get(String(a.jobId));
      if (!job) return null;
      const company = (data.companies || []).find(
        (c) => c.id === job.companyId
      );
      const status = a.status || "pending";
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
                <button class="save-btn" data-remove="${job.id}">
                  Remove <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>

              <h6 class="company-name">${company?.name || ""}</h6>
              <h5 class="job-title">${job.title}</h5>
              <small class="company">Applied: ${new Date(
                a.appliedAt
              ).toLocaleDateString()}</small>

              <div class="applied-status-row">
                ${getStatusBadge(status)}
              </div>

              <div class="job-tags">
                <span>${job.type}</span>
                <span>${job.category}</span>
              </div>
            </div>

            <div class="job-footer">
              <div>
                <strong>${job.salary || ""}</strong>
                <small>${company?.location || job.location || ""}</small>
              </div>
              <a class="btn-apply" href="${getJobUrl(job.id)}">View</a>
            </div>
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  emptyState.classList.add("d-none");
  list.classList.remove("d-none");
  list.innerHTML = cards;

  list.querySelectorAll("[data-job-card]").forEach((card) => {
    card.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.closest("button") || t.closest("a") || t.closest("select")))
        return;
      const jobId = card.getAttribute("data-job-card");
      if (!jobId) return;
      window.location.href = getJobUrl(jobId);
    });
  });

  list.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const jobId = btn.getAttribute("data-remove");
      removeAppliedJob(jobId);
      render().catch((err) => console.error(err));
    });
  });

}

clearBtn.addEventListener("click", () => {
  clearAppliedJobs();
  render().catch((err) => console.error(err));
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut();
  window.location.href = "/signin.html";
});

const sidebar = document.getElementById("dashboardSidebar");
const overlay = document.getElementById("sidebarOverlay");
const openBtn = document.getElementById("openSidebar");
const closeBtn = document.getElementById("closeSidebar");

function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

openBtn?.addEventListener("click", openSidebar);
closeBtn?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

render().catch((err) => console.error(err));
