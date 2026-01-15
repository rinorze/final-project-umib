import {
  getCurrentUser,
  isAuthenticated,
  signOut,
  getProfilePhotoUrl,
} from "/js/auth.js";

function ensureNavHost() {
  const host = document.getElementById("navAuth");
  return host || null;
}

function ensureNavAuthPlacement() {
  const host = ensureNavHost();
  if (!host) return;

  const navbar = host.closest(".navbar");
  if (!navbar) return;

  const container = navbar.querySelector(":scope > .container");
  if (!container) return;

  const toggler = container.querySelector(".navbar-toggler");
  if (!toggler) return;

  let wrapper = container.querySelector(".toggle-avatar-dropdown");

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "toggle-avatar-dropdown";
    toggler.parentNode?.insertBefore(wrapper, toggler);
  }

  const shouldMoveToggler = toggler.parentElement !== wrapper;
  const shouldMoveHost = host.parentElement !== wrapper;

  if (shouldMoveToggler) {
    wrapper.appendChild(toggler);
  }

  if (shouldMoveHost) {
    host.style.listStyle = "none";
    wrapper.appendChild(host);
  }
}

function getUserInitials(user) {
  if (!user?.fullName) return "U";
  const names = user.fullName.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return names[0][0].toUpperCase();
}

function createProfileDropdown(user) {
  const photoUrl = getProfilePhotoUrl();
  const initials = getUserInitials(user);

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown nav-profile-dropdown";

  const avatarBtn = document.createElement("button");
  avatarBtn.className = "nav-avatar-btn dropdown-toggle";
  avatarBtn.type = "button";
  avatarBtn.setAttribute("data-bs-toggle", "dropdown");
  avatarBtn.setAttribute("aria-expanded", "false");

  if (photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = user?.fullName || "Profile";
    img.className = "nav-avatar-img";
    avatarBtn.appendChild(img);
  } else {
    const initialsSpan = document.createElement("span");
    initialsSpan.className = "nav-avatar-initials";
    initialsSpan.textContent = initials;
    avatarBtn.appendChild(initialsSpan);
  }

  const menu = document.createElement("ul");
  menu.className = "dropdown-menu dropdown-menu-end nav-profile-menu";

  const userHeader = document.createElement("li");
  userHeader.innerHTML = `
    <div class="nav-profile-header">
      <div class="nav-profile-name">${user?.fullName || "User"}</div>
      <div class="nav-profile-email">${user?.email || ""}</div>
    </div>
  `;
  menu.appendChild(userHeader);

  const divider1 = document.createElement("li");
  divider1.innerHTML = '<hr class="dropdown-divider">';
  menu.appendChild(divider1);

  const dashboardItem = document.createElement("li");
  dashboardItem.innerHTML = `
    <a class="dropdown-item nav-profile-item" href="/dashboard/index.html">
       Dashboard
    </a>
  `;
  menu.appendChild(dashboardItem);

  const profileItem = document.createElement("li");
  profileItem.innerHTML = `
    <a class="dropdown-item nav-profile-item" href="/dashboard/profile.html">
       Profile
    </a>
  `;
  menu.appendChild(profileItem);

  const settingsItem = document.createElement("li");
  settingsItem.innerHTML = `
    <a class="dropdown-item nav-profile-item" href="/dashboard/settings.html">
       Settings
    </a>
  `;
  menu.appendChild(settingsItem);

  const divider2 = document.createElement("li");
  divider2.innerHTML = '<hr class="dropdown-divider">';
  menu.appendChild(divider2);

  const logoutItem = document.createElement("li");
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "dropdown-item nav-profile-item nav-profile-logout";
  logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
  logoutBtn.addEventListener("click", () => {
    signOut();
    window.location.href = "/index.html";
  });
  logoutItem.appendChild(logoutBtn);
  menu.appendChild(logoutItem);

  dropdown.appendChild(avatarBtn);
  dropdown.appendChild(menu);

  return dropdown;
}

export function renderNavAuth() {
  const host = ensureNavHost();
  if (!host) return;

  host.innerHTML = "";

  if (!isAuthenticated()) {
    const a = document.createElement("a");
    a.href = "/signin.html";
    a.className = "btn btn-md btn-signup";
    a.textContent = "Sign In";
    host.appendChild(a);
    return;
  }

  const user = getCurrentUser();
  host.appendChild(createProfileDropdown(user));
}

document.addEventListener("DOMContentLoaded", () => {
  ensureNavAuthPlacement();
  renderNavAuth();
});
