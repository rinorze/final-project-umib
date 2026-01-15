const USERS_KEY = "jp_users";
const SESSION_KEY = "jp_session";
const CUSTOM_JOBS_KEY = "jp_custom_jobs";
const REVIEWS_KEY = "jp_company_reviews";
const RESET_TOKENS_KEY = "jp_reset_tokens";
const PROFILE_KEY = "jp_profile";
const SETTINGS_KEY = "jp_settings";

const ADMIN_EMAIL = "rzeqiri03@gmail.com";

export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYER: "employer",
  JOBSEEKER: "jobseeker"
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUserRole(user) {
  if (!user) return null;
  if (user.email === ADMIN_EMAIL) return USER_ROLES.ADMIN;
  return user.role || USER_ROLES.JOBSEEKER;
}

export function isAdmin(user) {
  return getUserRole(user) === USER_ROLES.ADMIN;
}

export function isEmployer(user) {
  const role = getUserRole(user);
  return role === USER_ROLES.EMPLOYER || role === USER_ROLES.ADMIN;
}

export function isJobseeker(user) {
  const role = getUserRole(user);
  return role === USER_ROLES.JOBSEEKER || role === USER_ROLES.ADMIN;
}

export function setUserRole(userId, role) {
  if (!Object.values(USER_ROLES).includes(role)) {
    return { ok: false, message: "Invalid role" };
  }

  const currentUser = getCurrentUser();
  if (!isAdmin(currentUser)) {
    return { ok: false, message: "Only admins can change roles" };
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, message: "User not found" };

  if (users[idx].email === ADMIN_EMAIL) {
    return { ok: false, message: "Cannot change admin role" };
  }

  users[idx].role = role;
  writeJson(USERS_KEY, users);
  return { ok: true };
}

export function setupRoleBasedSidebar() {
  const user = getCurrentUser();
  if (!user) return;

  const role = getUserRole(user);

  const postJobLink = document.getElementById("nav-post-job");
  const appliedLink = document.getElementById("nav-applied");
  const documentsLink = document.getElementById("nav-documents");
  const applicationsLink = document.getElementById("nav-applications");

  if (role === USER_ROLES.EMPLOYER) {
    if (appliedLink) appliedLink.style.display = "none";
    if (documentsLink) documentsLink.style.display = "none";
  } else if (role === USER_ROLES.JOBSEEKER) {
    if (postJobLink) postJobLink.style.display = "none";
    if (applicationsLink) applicationsLink.style.display = "none";
  }
}

export function getAllUsers() {
  const currentUser = getCurrentUser();
  if (!isAdmin(currentUser)) return [];
  return getUsers().map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: getUserRole(u),
    createdAt: u.createdAt,
    isAdmin: u.email === ADMIN_EMAIL
  }));
}

export function deleteUser(userId) {
  const currentUser = getCurrentUser();
  if (!isAdmin(currentUser)) {
    return { ok: false, message: "Only admins can delete users" };
  }

  const users = getUsers();
  const targetUser = users.find((u) => u.id === userId);

  if (!targetUser) return { ok: false, message: "User not found" };
  if (targetUser.email === ADMIN_EMAIL) {
    return { ok: false, message: "Cannot delete admin account" };
  }

  const filtered = users.filter((u) => u.id !== userId);
  writeJson(USERS_KEY, filtered);

  localStorage.removeItem(`jp_saved_${userId}`);
  localStorage.removeItem(`jp_applied_${userId}`);
  localStorage.removeItem(`jp_profile_${userId}`);
  localStorage.removeItem(`jp_settings_${userId}`);

  return { ok: true };
}

export function updateUser(userId, updates) {
  const currentUser = getCurrentUser();
  if (!isAdmin(currentUser)) {
    return { ok: false, message: "Only admins can update users" };
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, message: "User not found" };

  if (
    users[idx].email === ADMIN_EMAIL &&
    updates.email &&
    updates.email !== ADMIN_EMAIL
  ) {
    return { ok: false, message: "Cannot change admin email" };
  }

  if (updates.fullName) users[idx].fullName = updates.fullName;
  if (updates.role && users[idx].email !== ADMIN_EMAIL)
    users[idx].role = updates.role;

  writeJson(USERS_KEY, users);
  return { ok: true };
}

export function getSystemStats() {
  const currentUser = getCurrentUser();
  if (!isAdmin(currentUser)) return null;

  const users = getUsers();
  const jobs = getCustomJobs();
  const reviews = readJson(REVIEWS_KEY, []);

  const roleStats = {
    admin: 0,
    employer: 0,
    jobseeker: 0
  };

  users.forEach((u) => {
    const role = getUserRole(u);
    if (roleStats[role] !== undefined) roleStats[role]++;
  });

  return {
    totalUsers: users.length,
    roleStats,
    totalJobs: jobs.length,
    totalReviews: reviews.length,
    lastUserRegistered:
      users.length > 0 ? users[users.length - 1].createdAt : null
  };
}

function getSettingsKey(userId) {
  return `jp_settings_${userId}`;
}

export function getUserSettings() {
  const user = getCurrentUser();
  if (!user) return {};
  return readJson(getSettingsKey(user.id), {});
}

export function saveUserSettings(settings) {
  const user = getCurrentUser();
  if (!user) return;
  writeJson(getSettingsKey(user.id), settings);
}

function getProfileKey(userId) {
  return `jp_profile_${userId}`;
}

export function getProfile() {
  const user = getCurrentUser();
  if (!user) return {};
  return readJson(getProfileKey(user.id), {});
}

export function saveProfile(data) {
  const user = getCurrentUser();
  if (!user) return;
  writeJson(getProfileKey(user.id), data);
}

export function getProfilePhotoUrl() {
  const profile = getProfile();
  return profile.photoUrl || null;
}

export function setProfilePhoto(base64Url) {
  const profile = getProfile();
  profile.photoUrl = base64Url;
  saveProfile(profile);
  return { ok: true };
}

export function getResume() {
  const profile = getProfile();
  return profile.resumeFile || null;
}

export function setResume(fileData) {
  const profile = getProfile();
  profile.resumeFile = fileData;
  saveProfile(profile);
  return { ok: true };
}

export function getWorkExperience() {
  const profile = getProfile();
  return profile.workExperience || [];
}

export function addWorkExperience(exp) {
  const profile = getProfile();
  if (!profile.workExperience) profile.workExperience = [];
  const newExp = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...exp,
    createdAt: new Date().toISOString()
  };
  profile.workExperience.unshift(newExp);
  saveProfile(profile);
  return { ok: true, experience: newExp };
}

export function updateWorkExperience(id, exp) {
  const profile = getProfile();
  if (!profile.workExperience) return { ok: false, message: "Not found" };
  const idx = profile.workExperience.findIndex((e) => e.id === id);
  if (idx === -1) return { ok: false, message: "Not found" };
  profile.workExperience[idx] = { ...profile.workExperience[idx], ...exp };
  saveProfile(profile);
  return { ok: true };
}

export function removeWorkExperience(id) {
  const profile = getProfile();
  if (!profile.workExperience) return { ok: false };
  profile.workExperience = profile.workExperience.filter((e) => e.id !== id);
  saveProfile(profile);
  return { ok: true };
}

export function getEducation() {
  const profile = getProfile();
  return profile.education || [];
}

export function addEducation(edu) {
  const profile = getProfile();
  if (!profile.education) profile.education = [];
  const newEdu = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...edu,
    createdAt: new Date().toISOString()
  };
  profile.education.unshift(newEdu);
  saveProfile(profile);
  return { ok: true, education: newEdu };
}

export function updateEducation(id, edu) {
  const profile = getProfile();
  if (!profile.education) return { ok: false, message: "Not found" };
  const idx = profile.education.findIndex((e) => e.id === id);
  if (idx === -1) return { ok: false, message: "Not found" };
  profile.education[idx] = { ...profile.education[idx], ...edu };
  saveProfile(profile);
  return { ok: true };
}

export function removeEducation(id) {
  const profile = getProfile();
  if (!profile.education) return { ok: false };
  profile.education = profile.education.filter((e) => e.id !== id);
  saveProfile(profile);
  return { ok: true };
}

export function getCompanyReviews(companyId) {
  const reviews = readJson(REVIEWS_KEY, []);
  if (companyId) {
    return reviews.filter((r) => String(r.companyId) === String(companyId));
  }
  return reviews;
}

export function addCompanyReview({
  companyId,
  rating,
  title,
  pros,
  cons,
  recommend
}) {
  const user = getCurrentUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const reviews = readJson(REVIEWS_KEY, []);

  const existing = reviews.find(
    (r) => String(r.companyId) === String(companyId) && r.userId === user.id
  );
  if (existing)
    return { ok: false, message: "You have already reviewed this company" };

  const review = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    companyId: String(companyId),
    userId: user.id,
    userName: user.fullName,
    rating: Number(rating),
    title,
    pros,
    cons,
    recommend: Boolean(recommend),
    createdAt: new Date().toISOString()
  };

  reviews.unshift(review);
  writeJson(REVIEWS_KEY, reviews);
  return { ok: true, review };
}

export function getCompanyAverageRating(companyId) {
  const reviews = getCompanyReviews(companyId);
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length
  };
}

export function hasUserReviewedCompany(companyId) {
  const user = getCurrentUser();
  if (!user) return false;
  const reviews = getCompanyReviews(companyId);
  return reviews.some((r) => r.userId === user.id);
}

export function requestPasswordReset(email) {
  const mail = String(email || "")
    .trim()
    .toLowerCase();
  if (!mail) return { ok: false, message: "Email is required" };

  const users = getUsers();
  const user = users.find((u) => u.email === mail);
  if (!user) {
    return {
      ok: true,
      message: "If this email exists, you will receive reset instructions"
    };
  }

  const token = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const tokens = readJson(RESET_TOKENS_KEY, []);

  const filtered = tokens.filter((t) => t.email !== mail);
  filtered.push({
    token,
    email: mail,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  });

  writeJson(RESET_TOKENS_KEY, filtered);

  console.log(`Password reset token for ${mail}: ${token}`);

  return {
    ok: true,
    message: "If this email exists, you will receive reset instructions",
    token
  };
}

export function resetPassword(token, newPassword) {
  if (!token) return { ok: false, message: "Invalid token" };
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }

  const tokens = readJson(RESET_TOKENS_KEY, []);
  const tokenData = tokens.find((t) => t.token === token);

  if (!tokenData) return { ok: false, message: "Invalid or expired token" };

  if (new Date(tokenData.expiresAt) < new Date()) {
    return { ok: false, message: "Token has expired" };
  }

  const users = getUsers();
  const userIdx = users.findIndex((u) => u.email === tokenData.email);

  if (userIdx === -1) return { ok: false, message: "User not found" };

  users[userIdx].password = newPassword;
  writeJson(USERS_KEY, users);

  writeJson(
    RESET_TOKENS_KEY,
    tokens.filter((t) => t.token !== token)
  );

  return { ok: true, message: "Password reset successfully" };
}

export function socialSignIn(provider) {
  const providers = ["google", "linkedin"];
  if (!providers.includes(provider)) {
    return { ok: false, message: "Unsupported provider" };
  }

  const mockUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullName: provider === "google" ? "Google User" : "LinkedIn User",
    email: `${provider}.user.${Date.now()}@example.com`,
    provider,
    createdAt: new Date().toISOString()
  };

  const users = getUsers();
  users.push(mockUser);
  writeJson(USERS_KEY, users);
  writeJson(SESSION_KEY, {
    userId: mockUser.id,
    createdAt: new Date().toISOString()
  });

  return { ok: true, user: mockUser };
}

export function googleSignIn({ email, fullName, picture, googleId }) {
  if (!email) return { ok: false, message: "Email is required" };

  const mail = String(email).trim().toLowerCase();
  const users = getUsers();

  let user = users.find((u) => u.email === mail);

  if (user) {
    user.googleId = googleId;
    user.picture = picture;
    if (!user.provider) user.provider = "google";
    writeJson(USERS_KEY, users);
  } else {
    user = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      fullName: fullName || mail.split("@")[0],
      email: mail,
      googleId,
      picture,
      provider: "google",
      role: mail === ADMIN_EMAIL ? USER_ROLES.ADMIN : USER_ROLES.JOBSEEKER,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeJson(USERS_KEY, users);
  }

  writeJson(SESSION_KEY, {
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  return { ok: true, user };
}

export function applyWithProfile(
  jobId,
  { coverLetter, useResume = true } = {}
) {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };

  const user = getCurrentUser();
  const role = getUserRole(user);
  if (role === USER_ROLES.EMPLOYER) {
    return { ok: false, message: "Employers cannot apply to jobs" };
  }

  const profile = getProfile();
  const resume = useResume ? getResume() : null;

  const id = String(jobId);
  const key = getAppliedKey(userId);
  const current = readJson(key, []);
  const exists = current.some((x) => String(x.jobId) === id);
  if (exists) return { ok: true, applied: true, message: "Already applied" };

  const application = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    jobId: id,
    appliedAt: new Date().toISOString(),
    status: "pending",
    profile: {
      fullName: profile.fullName,
      email: getCurrentUser()?.email,
      phone: profile.phone,
      location: profile.location,
      skills: profile.skills,
      experience: profile.experience,
      workExperience: profile.workExperience,
      education: profile.education
    },
    coverLetter: coverLetter || null,
    hasResume: Boolean(resume)
  };

  const next = [application, ...current];
  writeJson(key, next);

  trackJobApplication(jobId);

  return { ok: true, applied: true, application };
}

const JOB_ANALYTICS_KEY = "jp_job_analytics";

export function trackJobView(jobId) {
  const analytics = readJson(JOB_ANALYTICS_KEY, {});
  const id = String(jobId);

  if (!analytics[id]) {
    analytics[id] = { views: 0, applications: 0, viewHistory: [] };
  }

  analytics[id].views++;
  analytics[id].viewHistory.push(new Date().toISOString());

  if (analytics[id].viewHistory.length > 100) {
    analytics[id].viewHistory = analytics[id].viewHistory.slice(-100);
  }

  writeJson(JOB_ANALYTICS_KEY, analytics);
}

export function trackJobApplication(jobId) {
  const analytics = readJson(JOB_ANALYTICS_KEY, {});
  const id = String(jobId);

  if (!analytics[id]) {
    analytics[id] = { views: 0, applications: 0, viewHistory: [] };
  }

  analytics[id].applications++;
  writeJson(JOB_ANALYTICS_KEY, analytics);
}

export function getJobAnalytics(jobId) {
  const analytics = readJson(JOB_ANALYTICS_KEY, {});
  const id = String(jobId);

  if (!analytics[id]) {
    return { views: 0, applications: 0, conversionRate: 0 };
  }

  const data = analytics[id];
  const conversionRate =
    data.views > 0 ? Math.round((data.applications / data.views) * 100) : 0;

  return {
    views: data.views,
    applications: data.applications,
    conversionRate,
    viewHistory: data.viewHistory || []
  };
}

export function getAllJobsAnalytics() {
  return readJson(JOB_ANALYTICS_KEY, {});
}

const SALARY_DATA = {
  "IT & Software": { min: 800, max: 2600, avg: 1500 },
  "Design & Creative": { min: 600, max: 1700, avg: 1100 },
  "Marketing & Sales": { min: 700, max: 2000, avg: 1100 },
  Finance: { min: 800, max: 1800, avg: 1200 },
  Education: { min: 800, max: 1200, avg: 950 },
  Engineering: { min: 1200, max: 2100, avg: 1600 },
  Healthcare: { min: 750, max: 3000, avg: 1200 },
  "Customer Support": { min: 600, max: 1600, avg: 900 },
  Administration: { min: 700, max: 1400, avg: 950 }
};

export function getSalaryInsights(category) {
  if (category && SALARY_DATA[category]) {
    return SALARY_DATA[category];
  }
  return SALARY_DATA;
}

export function compareSalary(category, salary) {
  const insights = getSalaryInsights(category);
  if (!insights || !salary) return null;

  const match = String(salary).match(/(\d+)/g);
  if (!match) return null;

  const salaryMin = parseInt(match[0]);
  const salaryMax = match[1] ? parseInt(match[1]) : salaryMin;
  const salaryAvg = (salaryMin + salaryMax) / 2;

  let comparison = "average";
  if (salaryAvg > insights.avg * 1.1) comparison = "above";
  else if (salaryAvg < insights.avg * 0.9) comparison = "below";

  return {
    offered: { min: salaryMin, max: salaryMax, avg: salaryAvg },
    market: insights,
    comparison,
    percentile: Math.round(
      ((salaryAvg - insights.min) / (insights.max - insights.min)) * 100
    )
  };
}

const COVER_LETTER_TEMPLATES = [
  {
    id: "general",
    name: "General Application",
    template: `Dear Hiring Manager,

I am writing to express my interest in the [JOB_TITLE] position at [COMPANY_NAME]. With my background in [YOUR_FIELD] and passion for [INDUSTRY], I believe I would be a valuable addition to your team.

In my previous role, I [ACHIEVEMENT_1]. I also [ACHIEVEMENT_2]. These experiences have equipped me with the skills necessary to excel in this position.

I am particularly drawn to [COMPANY_NAME] because of [REASON]. I am confident that my skills in [SKILL_1] and [SKILL_2] align well with the requirements of this role.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.

Best regards,
[YOUR_NAME]`
  },
  {
    id: "career-change",
    name: "Career Change",
    template: `Dear Hiring Manager,

I am excited to apply for the [JOB_TITLE] position at [COMPANY_NAME]. While my background is in [PREVIOUS_FIELD], I am eager to transition into [NEW_FIELD] and believe my transferable skills make me an excellent candidate.

Throughout my career, I have developed strong [TRANSFERABLE_SKILL_1] and [TRANSFERABLE_SKILL_2] skills that are directly applicable to this role. My experience in [RELEVANT_EXPERIENCE] has prepared me to [HOW_IT_APPLIES].

I have been preparing for this career transition by [PREPARATION_STEPS], demonstrating my commitment to succeeding in this new direction.

I would welcome the opportunity to discuss how my unique background can bring fresh perspectives to [COMPANY_NAME].

Sincerely,
[YOUR_NAME]`
  },
  {
    id: "entry-level",
    name: "Entry Level / Fresh Graduate",
    template: `Dear Hiring Manager,

I am writing to apply for the [JOB_TITLE] position at [COMPANY_NAME]. As a recent graduate from [UNIVERSITY] with a degree in [DEGREE], I am eager to begin my career in [FIELD].

During my studies, I [ACADEMIC_ACHIEVEMENT]. I also gained practical experience through [INTERNSHIP/PROJECT], where I [WHAT_YOU_DID].

I am particularly interested in [COMPANY_NAME] because [REASON]. I am a quick learner with strong [SKILL_1] and [SKILL_2] abilities, and I am confident in my ability to grow and contribute to your team.

Thank you for considering my application. I am excited about the possibility of starting my career at [COMPANY_NAME].

Best regards,
[YOUR_NAME]`
  },
  {
    id: "tech",
    name: "Technology / IT",
    template: `Dear Hiring Manager,

I am excited to apply for the [JOB_TITLE] role at [COMPANY_NAME]. With [X] years of experience in [TECH_FIELD] and proficiency in [TECHNOLOGIES], I am confident in my ability to contribute to your engineering team.

In my current role at [CURRENT_COMPANY], I have:
• [TECHNICAL_ACHIEVEMENT_1]
• [TECHNICAL_ACHIEVEMENT_2]
• [TECHNICAL_ACHIEVEMENT_3]

I am particularly interested in [COMPANY_NAME]'s work on [SPECIFIC_PROJECT/PRODUCT] and would love to bring my expertise in [SPECIFIC_TECH] to help advance your goals.

I look forward to discussing how my technical skills and experience can benefit [COMPANY_NAME].

Best regards,
[YOUR_NAME]`
  }
];

export function getCoverLetterTemplates() {
  return COVER_LETTER_TEMPLATES;
}

export function getCoverLetterTemplate(id) {
  return COVER_LETTER_TEMPLATES.find((t) => t.id === id);
}

const INTERVIEW_TIPS = {
  "IT & Software": [
    "Review common data structures and algorithms",
    "Practice coding problems on platforms like LeetCode",
    "Be ready to explain your past projects in detail",
    "Prepare for system design questions if senior-level",
    "Research the company's tech stack beforehand"
  ],
  "Design & Creative": [
    "Prepare a strong portfolio showcasing your best work",
    "Be ready to walk through your design process",
    "Practice explaining design decisions and trade-offs",
    "Research the company's brand and design style",
    "Prepare case studies of problems you've solved"
  ],
  "Marketing & Sales": [
    "Prepare examples of successful campaigns you've run",
    "Know the company's target market and competitors",
    "Be ready to discuss metrics and KPIs you've achieved",
    "Practice handling objections for sales roles",
    "Research current marketing trends in the industry"
  ],
  Finance: [
    "Review financial modeling and analysis concepts",
    "Be prepared for technical questions about accounting",
    "Know current market trends and economic conditions",
    "Practice explaining complex financial concepts simply",
    "Prepare examples of financial problems you've solved"
  ],
  default: [
    "Research the company thoroughly before the interview",
    "Prepare specific examples using the STAR method",
    "Practice common behavioral interview questions",
    "Prepare thoughtful questions to ask the interviewer",
    "Dress professionally and arrive early"
  ]
};

export function getInterviewTips(category) {
  return INTERVIEW_TIPS[category] || INTERVIEW_TIPS["default"];
}

export function getUsers() {
  return readJson(USERS_KEY, []);
}

export function getCurrentUser() {
  const session = readJson(SESSION_KEY, null);
  if (!session || !session.userId) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function signUp({
  fullName,
  email,
  password,
  role = USER_ROLES.JOBSEEKER
}) {
  const name = String(fullName || "").trim();
  const mail = String(email || "")
    .trim()
    .toLowerCase();
  const pass = String(password || "");

  if (!name) return { ok: false, message: "Full name is required." };
  if (!mail) return { ok: false, message: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return { ok: false, message: "Please enter a valid email." };
  }
  if (pass.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  const validRoles = [USER_ROLES.EMPLOYER, USER_ROLES.JOBSEEKER];
  const userRole = validRoles.includes(role) ? role : USER_ROLES.JOBSEEKER;

  const users = getUsers();
  const exists = users.some((u) => u.email === mail);
  if (exists)
    return { ok: false, message: "An account with this email already exists." };

  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullName: name,
    email: mail,
    password: pass,
    role: mail === ADMIN_EMAIL ? USER_ROLES.ADMIN : userRole,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson(USERS_KEY, users);
  writeJson(SESSION_KEY, {
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  return { ok: true, user };
}

export function signIn({ email, password }) {
  const mail = String(email || "")
    .trim()
    .toLowerCase();
  const pass = String(password || "");

  if (!mail) return { ok: false, message: "Email is required." };
  if (!pass) return { ok: false, message: "Password is required." };

  const users = getUsers();
  const user = users.find((u) => u.email === mail);
  if (!user || user.password !== pass) {
    return { ok: false, message: "Invalid email or password." };
  }

  writeJson(SESSION_KEY, {
    userId: user.id,
    createdAt: new Date().toISOString()
  });
  return { ok: true, user };
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

function requireUserId() {
  const user = getCurrentUser();
  if (!user) return null;
  return user.id;
}

function getSavedKey(userId) {
  return `jp_saved_${userId}`;
}

function getAppliedKey(userId) {
  return `jp_applied_${userId}`;
}

export function buildSignInUrlWithNext(nextPath) {
  const next = String(nextPath || "/");
  return `/signin.html?next=${encodeURIComponent(next)}`;
}

export function getSavedJobs() {
  const userId = requireUserId();
  if (!userId) return [];
  return readJson(getSavedKey(userId), []);
}

export function isJobSaved(jobId) {
  const id = String(jobId);
  return getSavedJobs().some((x) => String(x) === id);
}

export function toggleSavedJob(jobId) {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };

  const id = String(jobId);
  const key = getSavedKey(userId);
  const current = readJson(key, []);
  const exists = current.some((x) => String(x) === id);
  const next = exists
    ? current.filter((x) => String(x) !== id)
    : [id, ...current];
  writeJson(key, next);
  return { ok: true, saved: !exists };
}

export function clearSavedJobs() {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };
  writeJson(getSavedKey(userId), []);
  return { ok: true };
}

export function getAppliedJobs() {
  const userId = requireUserId();
  if (!userId) return [];
  return readJson(getAppliedKey(userId), []);
}

export function hasAppliedToJob(jobId) {
  const id = String(jobId);
  return getAppliedJobs().some((x) => String(x.jobId) === id);
}

export function applyToJob(jobId) {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };

  const user = getCurrentUser();
  const role = getUserRole(user);
  if (role === USER_ROLES.EMPLOYER) {
    return { ok: false, message: "Employers cannot apply to jobs" };
  }

  const id = String(jobId);
  const key = getAppliedKey(userId);
  const current = readJson(key, []);
  const exists = current.some((x) => String(x.jobId) === id);
  if (exists) return { ok: true, applied: true };

  const next = [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      jobId: id,
      appliedAt: new Date().toISOString(),
      status: "pending"
    },
    ...current
  ];
  writeJson(key, next);
  return { ok: true, applied: true };
}

export function updateApplicationStatus(jobId, status) {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };

  const validStatuses = [
    "pending",
    "reviewed",
    "interview",
    "rejected",
    "accepted"
  ];
  if (!validStatuses.includes(status)) {
    return { ok: false, message: "Invalid status" };
  }

  const id = String(jobId);
  const key = getAppliedKey(userId);
  const current = readJson(key, []);
  const idx = current.findIndex((x) => String(x.jobId) === id);

  if (idx === -1) return { ok: false, message: "Application not found" };

  current[idx].status = status;
  current[idx].statusUpdatedAt = new Date().toISOString();
  writeJson(key, current);
  return { ok: true };
}

export function getApplicationStatus(jobId) {
  const id = String(jobId);
  const applied = getAppliedJobs().find((x) => String(x.jobId) === id);
  return applied?.status || null;
}

export function removeAppliedJob(jobId) {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };
  const id = String(jobId);
  const key = getAppliedKey(userId);
  const current = readJson(key, []);
  writeJson(
    key,
    current.filter((x) => String(x.jobId) !== id)
  );
  return { ok: true };
}

export function clearAppliedJobs() {
  const userId = requireUserId();
  if (!userId) return { ok: false, message: "Not authenticated" };
  writeJson(getAppliedKey(userId), []);
  return { ok: true };
}

export function getApplicationsForEmployer(staticJobs = []) {
  const user = getCurrentUser();
  if (!user) return [];

  const role = getUserRole(user);
  if (role !== USER_ROLES.EMPLOYER && role !== USER_ROLES.ADMIN) return [];

  const customJobs = getCustomJobs();

  let employerJobs;
  let employerJobIds;

  if (role === USER_ROLES.ADMIN) {
    const allJobs = [...customJobs, ...staticJobs];
    employerJobs = allJobs;
    employerJobIds = new Set(allJobs.map((j) => String(j.id)));
  } else {
    employerJobs = customJobs.filter((j) => j.postedBy === user.id);
    employerJobIds = new Set(employerJobs.map((j) => String(j.id)));
  }

  if (employerJobIds.size === 0 && role !== USER_ROLES.ADMIN) return [];

  const users = getUsers();
  const applications = [];

  users.forEach((u) => {
    const userApplied = readJson(`jp_applied_${u.id}`, []);
    userApplied.forEach((app) => {
      const jobMatch =
        role === USER_ROLES.ADMIN || employerJobIds.has(String(app.jobId));

      if (jobMatch) {
        const job = employerJobs.find(
          (j) => String(j.id) === String(app.jobId)
        );
        const userProfile = readJson(`jp_profile_${u.id}`, {});
        const userResume = readJson(`jp_resume_${u.id}`, null);

        applications.push({
          ...app,
          applicant: {
            id: u.id,
            fullName:
              app.profile?.fullName ||
              userProfile.fullName ||
              u.fullName ||
              "Unknown",
            email: app.profile?.email || u.email,
            phone: app.profile?.phone || userProfile.phone,
            location: app.profile?.location || userProfile.location,
            bio: userProfile.bio,
            photoUrl: userProfile.photoUrl,
            skills: app.profile?.skills || userProfile.skills || [],
            experience: app.profile?.experience || userProfile.experience,
            workExperience:
              app.profile?.workExperience || userProfile.workExperience || [],
            education: app.profile?.education || userProfile.education || [],
            hasResume: app.hasResume || Boolean(userResume),
            resume: userResume
          },
          job: job || { id: app.jobId, title: "Unknown Job" }
        });
      }
    });
  });

  return applications.sort(
    (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
  );
}

export function updateApplicationStatusByEmployer(applicantId, jobId, status) {
  const user = getCurrentUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const role = getUserRole(user);
  if (role !== USER_ROLES.EMPLOYER && role !== USER_ROLES.ADMIN) {
    return { ok: false, message: "Not authorized" };
  }

  const validStatuses = [
    "pending",
    "reviewed",
    "interview",
    "rejected",
    "accepted"
  ];
  if (!validStatuses.includes(status)) {
    return { ok: false, message: "Invalid status" };
  }

  const customJobs = getCustomJobs();
  const job = customJobs.find(
    (j) => String(j.id) === String(jobId) && j.postedBy === user.id
  );
  if (!job && role !== USER_ROLES.ADMIN) {
    return { ok: false, message: "Job not found or not authorized" };
  }

  const key = `jp_applied_${applicantId}`;
  const current = readJson(key, []);
  const idx = current.findIndex((x) => String(x.jobId) === String(jobId));

  if (idx === -1) return { ok: false, message: "Application not found" };

  current[idx].status = status;
  current[idx].statusUpdatedAt = new Date().toISOString();
  current[idx].updatedBy = user.id;
  writeJson(key, current);
  return { ok: true };
}

export function getCustomJobs() {
  return readJson(CUSTOM_JOBS_KEY, []);
}

export function addCustomJob(job) {
  const user = getCurrentUser();
  const current = getCustomJobs();
  const nextJob = {
    ...job,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    postedDate: new Date().toISOString().slice(0, 10),
    postedBy: user?.id || null
  };
  writeJson(CUSTOM_JOBS_KEY, [nextJob, ...current]);
  return { ok: true, job: nextJob };
}

export function requireAuth({ redirectTo = "/signin.html" } = {}) {
  if (!isAuthenticated()) {
    const next = window.location.pathname + window.location.search;
    window.location.replace(buildSignInUrlWithNext(next));
    return false;
  }
  return true;
}

export function redirectIfAuthed({ to = "/dashboard/index.html" } = {}) {
  if (isAuthenticated()) {
    window.location.replace(to);
    return true;
  }
  return false;
}
