async function init() {
  const res = await fetch("/data/data.json");
  const data = await res.json();

  const list = document.getElementById("companiesList");
  if (!list) return;

  const jobCounts = {};
  (data.jobs || []).forEach((j) => {
    jobCounts[j.companyId] = (jobCounts[j.companyId] || 0) + 1;
  });

  list.innerHTML = (data.companies || [])
    .map(
      (c) => `
      <div class="col-md-6 col-lg-4">
        <a href="/company.html?id=${c.id}" class="company-card-link">
          <div class="company-card">
            <div class="company-card-header">
              <div class="company-card-logo">
                ${c.logo ? `<img src="/${c.logo}" alt="${c.name} Logo">` : ""}
              </div>
              <div class="company-card-info">
                <h5 class="company-card-name">${c.name}</h5>
                <p class="company-card-location">
                  <i class="fa-solid fa-location-dot"></i> ${c.location}
                </p>
              </div>
            </div>
            <p class="company-card-desc">
              ${
                c.description ||
                `${c.name} is a leading company based in ${c.location}.`
              }
            </p>
            <div class="company-card-footer">
              <span class="company-card-jobs">${
                jobCounts[c.id] || 0
              } open jobs</span>
              <span class="company-card-link-text">View profile <i class="fa-solid fa-arrow-right"></i></span>
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
