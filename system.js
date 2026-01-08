// Import Firebase Storage
import { FirebaseStorage } from './firebase-config.js';

// ===============================
// GLOBALS
// ===============================
let appData = null;
let currentRole = 'member';
let isRegisterMode = false;
let currentLang = 'ar';
let isDarkMode = false;
let editingUserId = null;
let currentFilter = 'all';

// ===============================
// LOCAL SESSION (PER DEVICE)
// ===============================
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

// ===============================
// INITIALIZE
// ===============================
async function initializeApp() {
  appData = await FirebaseStorage.getData();

  const user = getCurrentUser();
  if (user) {
    await showDashboard(user.role);
  }
}

// ===============================
// AUTH
// ===============================

// Admin Login
async function handleAdminLogin() {
  const name = document.getElementById('userName').value.trim().toLowerCase();
  const password = document.getElementById('userPassword').value;

  if (
    (name === 'فارس أكرم'.toLowerCase() || name === 'fares akram') &&
    password === '2388'
  ) {
    setCurrentUser({ role: 'admin', name: 'فارس أكرم' });
    await showDashboard('admin');
  } else {
    alert('اسم أو كلمة مرور خاطئة!');
  }
}

// Member Register
async function handleMemberRegister() {
  const name = userName.value;
  const password = userPassword.value;

  await reloadData();

  if (appData.members.find(m => m.name === name)) {
    alert('الموظف مسجل بالفعل');
    return;
  }

  const newMember = {
    id: Date.now(),
    name,
    password,
    attendance: [],
    requests: []
  };

  await FirebaseStorage.addMember(newMember);

  setCurrentUser({
    role: 'member',
    id: newMember.id,
    name: newMember.name
  });

  await showDashboard('member');
}

// Member Login
async function handleMemberLogin() {
  const name = userName.value;
  const password = userPassword.value;

  await reloadData();

  const member = appData.members.find(
    m => m.name === name && m.password === password
  );

  if (!member) {
    alert('بيانات غير صحيحة');
    return;
  }

  setCurrentUser({
    role: 'member',
    id: member.id,
    name: member.name
  });

  await showDashboard('member');
}

// Leader Register
async function handleLeaderRegister() {
  const name = userName.value;
  const password = userPassword.value;

  await reloadData();

  const newLeader = {
    id: Date.now(),
    name,
    password
  };

  appData.leaders.push(newLeader);
  await FirebaseStorage.saveData(appData);

  setCurrentUser({
    role: 'leader',
    id: newLeader.id,
    name: newLeader.name
  });

  await showDashboard('leader');
}

// Leader Login
async function handleLeaderLogin() {
  const name = userName.value;
  const password = userPassword.value;

  await reloadData();

  const leader = appData.leaders.find(
    l => l.name === name && l.password === password
  );

  if (!leader) {
    alert('بيانات غير صحيحة');
    return;
  }

  setCurrentUser({
    role: 'leader',
    id: leader.id,
    name: leader.name
  });

  await showDashboard('leader');
}

// ===============================
// DASHBOARD
// ===============================
async function showDashboard(role) {
  const user = getCurrentUser();
  if (!user || user.role !== role) {
    logout();
    return;
  }

  document.getElementById('authScreen').classList.add('hidden');
  memberDashboard.classList.add('hidden');
  leaderDashboard.classList.add('hidden');
  adminDashboard.classList.add('hidden');

  if (role === 'member') {
    memberDashboard.classList.remove('hidden');
    loadMemberDashboard();
  }

  if (role === 'leader') {
    leaderDashboard.classList.remove('hidden');
    loadLeaderDashboard();
  }

  if (role === 'admin') {
    adminDashboard.classList.remove('hidden');
    loadAdminDashboard();
  }
}

// ===============================
// MEMBER DASHBOARD
// ===============================
function loadMemberDashboard() {
  const user = getCurrentUser();
  const member = appData.members.find(m => m.id === user.id);
  if (!member) return;

  memberNameNav.textContent = member.name;
}

// ===============================
// LEADER DASHBOARD
// ===============================
function loadLeaderDashboard() {
  const user = getCurrentUser();
  const leader = appData.leaders.find(l => l.id === user.id);
  if (!leader) return;

  leaderNameNav.textContent = leader.name;
}

// ===============================
// ADMIN DASHBOARD
// ===============================
function loadAdminDashboard() {
  adminTotalMembers.textContent = appData.members.length;
  adminTotalLeaders.textContent = appData.leaders.length;
}

// ===============================
// UTILS
// ===============================
async function reloadData() {
  appData = await FirebaseStorage.getData();
}

function logout() {
  clearCurrentUser();
  location.reload();
}

// ===============================
document.addEventListener('DOMContentLoaded', initializeApp);
window.logout = logout;
