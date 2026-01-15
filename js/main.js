import {
  getCurrentUser,
  isAuthenticated,
  toggleSavedJob,
  isJobSaved,
  applyToJob,
  hasAppliedToJob,
  buildSignInUrlWithNext,
  getCustomJobs
} from "/js/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  loadHomeJobs();
  loadHomeCategories();
});

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

async function loadHomeJobs() {
  try {
    const user = getCurrentUser();
    const res = await fetch("/data/data.json");
    const data = await res.json();

    const jobsContainer = document.getElementById("homeJobs");
    if (!jobsContainer) return;

    const customJobs = getCustomJobs();
    const allJobs = [...(data.jobs || []), ...customJobs];

    const latestJobs = allJobs
      .sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0))
      .slice(0, 9);

    jobsContainer.innerHTML = latestJobs
      .map((job) => {
        const company = (data.companies || []).find(
          (c) => c.id === job.companyId
        );
        const saved = user ? isJobSaved(job.id) : false;
        const applied = user ? hasAppliedToJob(job.id) : false;

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
              <button class="btn-apply" data-apply="${job.id}" ${
          applied ? "disabled" : ""
        }>
                ${applied ? "Applied" : "Apply now"}
              </button>
            </div>
          </div>
        </div>
        `;
      })
      .join("");

    jobsContainer.querySelectorAll("[data-save]").forEach((btn) => {
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

    jobsContainer.querySelectorAll("[data-apply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const jobId = btn.getAttribute("data-apply");

        if (!isAuthenticated()) {
          window.location.href = buildSignInUrlWithNext(getJobUrl(jobId));
          return;
        }

        applyToJob(jobId);
        btn.textContent = "Applied";
        btn.disabled = true;
      });
    });

    wireCardNavigation(jobsContainer);
  } catch (err) {
    console.error("Failed to load jobs:", err);
  }
}

function getCategoryUrl(category) {
  const params = new URLSearchParams();
  params.set("category", category);
  return `/jobs.html?${params.toString()}`;
}

function getCategoryMeta(category) {
  const map = {
    "IT & Software": {
      icon: "fa-solid fa-code",
      desc: "Developer, DevOps, IT Support, Cloud Engineer"
    },
    "Design & Creative": {
      icon: "fa-solid fa-palette",
      desc: "UI/UX, Graphic Design, Motion Graphics"
    },
    "Marketing & Sales": {
      icon: "fa-solid fa-bullhorn",
      desc: "Social Media, SEO, Content, Growth Marketing"
    },
    Finance: {
      icon: "fa-solid fa-chart-line",
      desc: "Accounting, Investment, Financial Analysis"
    },
    Education: {
      icon: "fa-solid fa-graduation-cap",
      desc: "Teachers, Professors, Tutors, Trainers"
    },
    Engineering: {
      icon: "fa-solid fa-gears",
      desc: "Electrical, Mechanical, Civil, Systems"
    },
    Healthcare: {
      icon: "fa-solid fa-heart-pulse",
      desc: "Doctors, Nurses, Medical Staff, Pharmacists"
    },
    "Customer Support": {
      icon: "fa-solid fa-headset",
      desc: "Help Desk, Support Agents, Customer Success"
    },
    Administration: {
      icon: "fa-solid fa-clipboard-list",
      desc: "Office Management, HR, Admin Support"
    }
  };

  const meta = map[category] || {
    icon: "fa-solid fa-briefcase",
    desc: "Browse available roles in this category"
  };
  return { icon: meta.icon, desc: meta.desc };
}

async function loadHomeCategories() {
  try {
    const host = document.getElementById("homeCategories");
    if (!host) return;

    const res = await fetch("/data/data.json");
    const data = await res.json();

    const jobs = [...(data.jobs || []), ...getCustomJobs()];
    const categories = Array.isArray(data.categories) ? data.categories : [];

    const counts = new Map();
    jobs.forEach((j) => {
      const c = j?.category ? String(j.category) : "";
      if (!c) return;
      counts.set(c, (counts.get(c) || 0) + 1);
    });

    const sorted = categories
      .map((c) => ({ category: c, count: counts.get(c) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    host.innerHTML = sorted
      .map(({ category, count }) => {
        const meta = getCategoryMeta(category);
        return `
          <div class="col-lg-3 col-md-6">
            <a class="category-card" href="${getCategoryUrl(category)}">
              <div class="category-icon"><i class="${meta.icon}"></i></div>
              <div class="category-title">${category}</div>
              <div class="category-desc">${meta.desc}</div>
              <div class="category-count">${count} Jobs</div>
            </a>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}
