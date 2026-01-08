// Import Firebase Storage
import { FirebaseStorage } from './firebase-config.js';

// Global variables
let appData = null;
let currentRole = 'member';
// ===== Local Session (Per Device) =====
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}
 
let isRegisterMode = false;
let currentLang = 'ar';
let isDarkMode = false;
let editingUserId = null;
let currentFilter = 'all';

// Initialize app
async function initializeApp() {
  try {
    console.log('🔄 جاري التحميل من Firebase...');
    appData = await FirebaseStorage.getData();
    console.log('✅ تم تحميل البيانات:', appData);
const user = getCurrentUser();
if (user) {
  await showDashboard(user.role);
}

    currentLang = appData.language || 'ar';
    isDarkMode = appData.darkMode || false;
    applyDarkMode();
    
  } catch (error) {
    console.error('❌ خطأ في التحميل:', error);
    alert('حدث خطأ في تحميل البيانات. تأكد من اتصال الإنترنت.');
  }
}

// Save & Reload
async function saveStorage(data) {
  try {
    await FirebaseStorage.saveData(data);
    appData = data;
    console.log('💾 تم الحفظ');
  } catch (error) {
    console.error('❌ خطأ في الحفظ:', error);
    alert('حدث خطأ في حفظ البيانات!');
  }
}

async function reloadData() {
  try {
    appData = await FirebaseStorage.getData();
    return appData;
  } catch (error) {
    console.error('❌ خطأ في إعادة التحميل:', error);
    return appData;
  }
}

// Dark Mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');
  if (appData) {
    appData.darkMode = isDarkMode;
    FirebaseStorage.updateField('darkMode', isDarkMode);
  }
  const icon = document.querySelector('.dark-mode-toggle i');
  if (icon) {
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function applyDarkMode() {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    const icon = document.querySelector('.dark-mode-toggle i');
    if (icon) icon.className = 'fas fa-sun';
  }
}

// Language (يمكن تفعيله لاحقاً)
function updateLanguage() {
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;
}

// Role Selection
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentRole = this.dataset.role;
    
    const toggleBtn = document.getElementById('toggleRegister');
    const registerFields = document.getElementById('registerFields');
    
    registerFields.classList.add('hidden');
    isRegisterMode = false;
    
    if (currentRole === 'admin') {
      toggleBtn.classList.add('hidden');
    } else {
      toggleBtn.classList.remove('hidden');
      toggleBtn.textContent = currentRole === 'leader' ? 'تسجيل قائد جديد' : 'تسجيل موظف جديد';
    }
  });
});

// Toggle Register
document.getElementById('toggleRegister').addEventListener('click', function() {
  isRegisterMode = !isRegisterMode;
  const registerFields = document.getElementById('registerFields');
  const memberFields = document.getElementById('memberRegFields');
  const leaderFields = document.getElementById('leaderRegFields');
  
  if (isRegisterMode) {
    registerFields.classList.remove('hidden');
    if (currentRole === 'member') {
      memberFields.classList.remove('hidden');
      leaderFields.classList.add('hidden');
    } else {
      memberFields.classList.add('hidden');
      leaderFields.classList.remove('hidden');
    }
    this.textContent = 'العودة لتسجيل الدخول';
  } else {
    registerFields.classList.add('hidden');
    memberFields.classList.add('hidden');
    leaderFields.classList.add('hidden');
    this.textContent = currentRole === 'leader' ? 'تسجيل قائد جديد' : 'تسجيل موظف جديد';
  }
});

// Auth Form
document.getElementById('authForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (currentRole === 'admin') {
    await handleAdminLogin();
  } else if (currentRole === 'member') {
    isRegisterMode ? await handleMemberRegister() : await handleMemberLogin();
  } else if (currentRole === 'leader') {
    isRegisterMode ? await handleLeaderRegister() : await handleLeaderLogin();
  }
});

// Admin Login
async function handleAdminLogin() {
  setCurrentUser({ role: 'admin', name: 'فارس أكرم' });
  await reloadData();
  const name = document.getElementById('userName').value.trim().toLowerCase();
  const password = document.getElementById('userPassword').value;
  
  if ((name === 'فارس أكرم' || name === 'fares akram') && password === '2388') {
setCurrentUser({
  role: 'member', // أو admin / leader حسب المكان
  id: member?.id,
  name
});

    await reloadData();
    await showDashboard('admin');
  } else {
    alert('اسم أو كلمة مرور خاطئة!');
  }
}

// Member Register
async function handleMemberRegister() {
  const name = document.getElementById('userName').value;
  const password = document.getElementById('userPassword').value;
  const whatsapp = document.getElementById('regWhatsapp').value;
  const email = document.getElementById('regEmail').value;
  const dayOff = document.getElementById('regDayOff').value;
  const checkIn = document.getElementById('regCheckIn').value;
  const checkOut = document.getElementById('regCheckOut').value;
  
  if (!name || !password || !whatsapp || !email || !dayOff || !checkIn || !checkOut) {
    alert('يرجى ملء جميع الحقول المطلوبة!');
    return;
  }
  
  await reloadData();
  
  if (appData.members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
    alert('هذا الموظف مسجل بالفعل!');
    return;
  }
  
  const newMember = {
    id: Date.now(),
    name, password, whatsapp, email, dayOff, checkIn, checkOut,
    status: 'absent',
    attendance: [],
    requests: []
  };
  
  await FirebaseStorage.addMember(newMember);
  await FirebaseStorage.setCurrentUser({ role: 'member', id: newMember.id, name });
  await reloadData();
  
  alert('✅ تم التسجيل بنجاح!');
  await showDashboard('member');
}

// Member Login
async function handleMemberLogin() {
  const name = document.getElementById('userName').value;
  const password = document.getElementById('userPassword').value;
  
  await reloadData();
  
  const member = appData.members.find(m => m.name === name && m.password === password);
  
  if (member) {
    setCurrentUser({
  role: 'member',
  id: member.id,
  name: member.name
});

setCurrentUser({
  role: 'member', // أو admin / leader حسب المكان
  id: member?.id,
  name
});
    await reloadData();
    await showDashboard('member');
  } else {
    alert('الاسم أو كلمة المرور غير صحيحة!');
  }
}

// Leader Register
async function handleLeaderRegister() {
  const name = document.getElementById('userName').value;
  const password = document.getElementById('userPassword').value;
  const whatsapp = document.getElementById('regWhatsapp').value;
  const email = document.getElementById('regEmail').value;
  const shift = document.getElementById('regShift').value;
  
  if (!name || !password || !whatsapp || !email || !shift) {
    alert('يرجى ملء جميع الحقول المطلوبة!');
    return;
  }
  
  await reloadData();
  
  if (appData.leaders.find(l => l.name.toLowerCase() === name.toLowerCase())) {
    alert('هذا القائد مسجل بالفعل!');
    return;
  }
  
  const newLeader = { id: Date.now(), name, password, whatsapp, email, shift };
  appData.leaders.push(newLeader);
  await saveStorage(appData);
  
  await FirebaseStorage.setCurrentUser({ role: 'leader', id: newLeader.id, name, shift });
  
  alert('✅ تم التسجيل بنجاح!');
  setCurrentUser({
  role: 'member',
  id: newMember.id,
  name: newMember.name
});
setCurrentUser({
  role: 'leader',
  id: leader.id,
  name: leader.name,
  shift: leader.shift
});

  await showDashboard('leader');
}

// Leader Login
async function handleLeaderLogin() {
  const name = document.getElementById('userName').value;
  const password = document.getElementById('userPassword').value;
  
  await reloadData();
  
  const leader = appData.leaders.find(l => l.name === name && l.password === password);
  
  if (leader) {
setCurrentUser({
  role: 'member', // أو admin / leader حسب المكان
  id: member?.id,
  name
});
    await reloadData();
    await showDashboard('leader');
  } else {
    alert('الاسم أو كلمة المرور غير صحيحة!');
  }
}

// Show Dashboard
async function showDashboard(role) {
  const user = getCurrentUser();
if (!user || user.role !== role) {
  logout();
  return;
}

  await reloadData();
  
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('memberDashboard').classList.add('hidden');
  document.getElementById('leaderDashboard').classList.add('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  
  if (role === 'member') {
    document.getElementById('memberDashboard').classList.remove('hidden');
    loadMemberDashboard();
  } else if (role === 'leader') {
    document.getElementById('leaderDashboard').classList.remove('hidden');
    loadLeaderDashboard();
  } else if (role === 'admin') {
const user = getCurrentUser();

if (user && user.role === 'admin') {
  document.getElementById('adminDashboard').classList.remove('hidden');
}
    loadAdminDashboard();
  }
}

// ==========================================
// MEMBER DASHBOARD
// ==========================================

function loadMemberDashboard() {
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  if (!member) {
    alert('خطأ: لم يتم العثور على بيانات الموظف!');
    return;
  }
  
  // Update UI
  document.getElementById('memberNameNav').textContent = member.name;
  document.getElementById('memberNameHero').textContent = member.name;
  const avatar = document.getElementById('memberAvatar');
  if (avatar) avatar.textContent = member.name.charAt(0);
  document.getElementById('memberCheckIn').textContent = member.checkIn;
  document.getElementById('memberCheckOut').textContent = member.checkOut;
  document.getElementById('memberDayOff').textContent = member.dayOff;
  
  // Load tasks
  loadMemberTasks();
}

function loadMemberTasks() {
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  const memberTasksContainer = document.getElementById('memberTasks');
  
  if (!memberTasksContainer) return;
  
  const memberTasks = appData.tasks ? appData.tasks.filter(t => t.memberId === member.id) : [];
  
  if (memberTasks.length === 0) {
    memberTasksContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        <i class="fas fa-tasks" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
        <p>لا توجد مهام مسندة حالياً</p>
      </div>
    `;
  } else {
    memberTasksContainer.innerHTML = memberTasks.map(task => `
      <div class="task-item" style="background: var(--bg-secondary); padding: 20px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">${task.details}</h4>
        <p style="color: var(--text-secondary); font-size: 14px; margin: 5px 0;">
          <i class="fas fa-user-tie"></i> مُسند بواسطة: ${task.assignedBy}
        </p>
        <span class="task-type" style="display: inline-block; background: var(--accent); color: white; padding: 5px 12px; border-radius: 5px; font-size: 12px; margin-top: 10px;">
          ${task.type}
        </span>
        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 10px;">
          <i class="fas fa-calendar"></i> ${new Date(task.date).toLocaleDateString('ar-EG')}
        </p>
      </div>
    `).join('');
  }
}

// Record Check In/Out
async function recordCheckIn() {
  await reloadData();
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  
  if (!member) {
    alert('حدث خطأ!');
    return;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDate = now.toISOString().split('T')[0];
  
  if (!member.attendance) member.attendance = [];
  
  const todayRecord = member.attendance.find(a => a.date === currentDate);
  if (todayRecord && todayRecord.actualCheckIn) {
    alert('لقد سجلت حضورك اليوم بالفعل!');
    return;
  }
  
  const [scheduledHour, scheduledMin] = member.checkIn.split(':').map(Number);
  const [actualHour, actualMin] = currentTime.split(':').map(Number);
  const lateMinutes = Math.max(0, (actualHour * 60 + actualMin) - (scheduledHour * 60 + scheduledMin));
  
  const attendanceRecord = {
    date: currentDate,
    actualCheckIn: currentTime,
    scheduledCheckIn: member.checkIn,
    lateMinutes: lateMinutes,
    status: lateMinutes > 0 ? 'late' : 'onTime'
  };
  
  if (todayRecord) {
    Object.assign(todayRecord, attendanceRecord);
  } else {
    member.attendance.push(attendanceRecord);
  }
  
  await FirebaseStorage.updateMember(member.id, { attendance: member.attendance });
  await reloadData();
  
  if (lateMinutes > 0) {
    alert(`✅ تم تسجيل الحضور!\n⚠️ تأخرت ${lateMinutes} دقيقة`);
  } else {
    alert('✅ تم تسجيل الحضور في الموعد!');
  }
}

async function recordCheckOut() {
  await reloadData();
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  
  if (!member) {
    alert('حدث خطأ!');
    return;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDate = now.toISOString().split('T')[0];
  
  if (!member.attendance) member.attendance = [];
  
  const todayRecord = member.attendance.find(a => a.date === currentDate);
  
  if (!todayRecord || !todayRecord.actualCheckIn) {
    alert('يجب تسجيل الحضور أولاً!');
    return;
  }
  
  if (todayRecord.actualCheckOut) {
    alert('لقد سجلت انصرافك اليوم بالفعل!');
    return;
  }
  
  const [scheduledHour, scheduledMin] = member.checkOut.split(':').map(Number);
  const [actualHour, actualMin] = currentTime.split(':').map(Number);
  const earlyMinutes = Math.max(0, (scheduledHour * 60 + scheduledMin) - (actualHour * 60 + actualMin));
  
  todayRecord.actualCheckOut = currentTime;
  todayRecord.scheduledCheckOut = member.checkOut;
  todayRecord.earlyMinutes = earlyMinutes;
  
  if (earlyMinutes > 0) {
    todayRecord.status = 'earlyLeave';
  }
  
  const checkInMinutes = parseInt(todayRecord.actualCheckIn.split(':')[0]) * 60 + parseInt(todayRecord.actualCheckIn.split(':')[1]);
  const checkOutMinutes = actualHour * 60 + actualMin;
  todayRecord.workHours = ((checkOutMinutes - checkInMinutes) / 60).toFixed(2);
  
  await FirebaseStorage.updateMember(member.id, { attendance: member.attendance });
  await reloadData();
  
  if (earlyMinutes > 0) {
    alert(`✅ تم تسجيل الانصراف!\n⚠️ انصرفت مبكراً ${earlyMinutes} دقيقة`);
  } else {
    alert(`✅ تم تسجيل الانصراف!\n⏱️ عملت ${todayRecord.workHours} ساعة اليوم`);
  }
}

// Request Modals
function openExceptionModal() {
  document.getElementById('exceptionModal').classList.add('active');
}

function closeExceptionModal() {
  document.getElementById('exceptionModal').classList.remove('active');
}

function openBreakModal() {
  document.getElementById('breakModal').classList.add('active');
}

function closeBreakModal() {
  document.getElementById('breakModal').classList.remove('active');
}

function openVacationModal() {
  document.getElementById('vacationModal').classList.add('active');
}

function closeVacationModal() {
  document.getElementById('vacationModal').classList.remove('active');
}

// Submit Requests
async function submitException() {
  const time = document.getElementById('exceptionTime').value;
  const reason = document.getElementById('exceptionReason').value;
  
  if (!time || !reason) {
    alert('يرجى ملء جميع الحقول!');
    return;
  }
  
  await reloadData();
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  
  const request = {
    id: Date.now(),
    type: 'exception',
    memberId: member.id,
    memberName: member.name,
    memberWhatsapp: member.whatsapp,
    time: time,
    reason: reason,
    status: 'pending',
    date: Date.now()
  };
  
  if (!appData.requests) appData.requests = [];
  appData.requests.push(request);
  await saveStorage(appData);
  
  alert('✅ تم إرسال طلب الاستئذان بنجاح!\nسيتم مراجعته من قبل الإدارة.');
  closeExceptionModal();
  document.getElementById('exceptionForm').reset();
}

async function submitBreak() {
  const duration = document.getElementById('breakDuration').value;
  const notes = document.getElementById('breakNotes').value;
  
  if (!duration) {
    alert('يرجى اختيار مدة البريك!');
    return;
  }
  
  await reloadData();
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  
  const request = {
    id: Date.now(),
    type: 'break',
    memberId: member.id,
    memberName: member.name,
    memberWhatsapp: member.whatsapp,
    duration: duration,
    notes: notes,
    status: 'pending',
    date: Date.now()
  };
  
  if (!appData.requests) appData.requests = [];
  appData.requests.push(request);
  await saveStorage(appData);
  
  alert('✅ تم إرسال طلب البريك بنجاح!\nسيتم مراجعته من قبل الإدارة.');
  closeBreakModal();
  document.getElementById('breakForm').reset();
}

async function submitVacation() {
  const startDate = document.getElementById('vacationStartDate').value;
  const endDate = document.getElementById('vacationEndDate').value;
  const reason = document.getElementById('vacationReason').value;
  
  if (!startDate || !endDate || !reason) {
    alert('يرجى ملء جميع الحقول!');
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  if (days <= 0) {
    alert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية!');
    return;
  }
  
  await reloadData();
  const member = appData.members.find(m => m.id === appData.currentUser.id);
  
  const request = {
    id: Date.now(),
    type: 'vacation',
    memberId: member.id,
    memberName: member.name,
    memberWhatsapp: member.whatsapp,
    startDate: startDate,
    endDate: endDate,
    days: days,
    reason: reason,
    status: 'pending',
    requestDate: Date.now()
  };
  
  if (!appData.requests) appData.requests = [];
  appData.requests.push(request);
  await saveStorage(appData);
  
  alert(`✅ تم إرسال طلب الإجازة بنجاح!\nعدد الأيام: ${days} يوم\nسيتم مراجعته من قبل الإدارة.`);
  closeVacationModal();
  document.getElementById('vacationForm').reset();
}

// ==========================================
// LEADER DASHBOARD
// ==========================================

function loadLeaderDashboard() {
  const leader = appData.leaders.find(l => l.id === appData.currentUser.id);
  if (!leader) {
    alert('خطأ: لم يتم العثور على بيانات القائد!');
    return;
  }
  
  document.getElementById('leaderNameNav').textContent = leader.name;
  document.getElementById('leaderNameHero').textContent = leader.name;
  const avatar = document.getElementById('leaderAvatar');
  if (avatar) avatar.textContent = leader.name.charAt(0);
  const badge = document.getElementById('leaderShiftBadge');
  if (badge) badge.textContent = leader.shift || 'غير محدد';
  
  // Calculate stats
  const now = new Date();
  const currentHour = now.getHours();
  
  let presentCount = 0;
  let absentCount = 0;
  
  appData.members.forEach(m => {
    if (!m.checkIn || !m.checkOut) {
      absentCount++;
      return;
    }
    const [checkInHour] = m.checkIn.split(':').map(Number);
    const [checkOutHour] = m.checkOut.split(':').map(Number);
    
    if (currentHour >= checkInHour && currentHour < checkOutHour) {
      presentCount++;
    } else {
      absentCount++;
    }
  });
  
  document.getElementById('totalMembers').textContent = appData.members.length;
  document.getElementById('presentMembers').textContent = presentCount;
  document.getElementById('absentMembers').textContent = absentCount;
  
  // Load members table
  loadMembersTable('all');
  
  // Load task member select
  const taskMemberSelect = document.getElementById('taskMember');
  if (taskMemberSelect) {
    taskMemberSelect.innerHTML = '<option value="">اختر الموظف</option>' + 
      appData.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  }
  
  // Load all tasks
  loadLeaderTasks();
}

function loadMembersTable(filter) {
  currentFilter = filter;
  const tbody = document.getElementById('membersTableBody');
  if (!tbody) return;
  
  const now = new Date();
  const currentHour = now.getHours();
  
  let filteredMembers = [...appData.members];
  
  if (filter === 'present') {
    filteredMembers = appData.members.filter(m => {
      if (!m.checkIn || !m.checkOut) return false;
      const [checkInHour] = m.checkIn.split(':').map(Number);
      const [checkOutHour] = m.checkOut.split(':').map(Number);
      return currentHour >= checkInHour && currentHour < checkOutHour;
    });
  } else if (filter === 'absent') {
    filteredMembers = appData.members.filter(m => {
      if (!m.checkIn || !m.checkOut) return true;
      const [checkInHour] = m.checkIn.split(':').map(Number);
      const [checkOutHour] = m.checkOut.split(':').map(Number);
      return currentHour < checkInHour || currentHour >= checkOutHour;
    });
  }
  
  if (filteredMembers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">لا توجد بيانات موظفين</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredMembers.map(member => {
    let isPresent = false;
    if (member.checkIn && member.checkOut) {
      const [checkInHour] = member.checkIn.split(':').map(Number);
      const [checkOutHour] = member.checkOut.split(':').map(Number);
      isPresent = currentHour >= checkInHour && currentHour < checkOutHour;
    }
    
    return `
      <tr>
        <td><strong>${member.name}</strong></td>
        <td>${member.whatsapp || '-'}</td>
        <td><span class="status-badge ${isPresent ? 'status-present' : 'status-absent'}">${isPresent ? 'حاضر' : 'منصرف'}</span></td>
        <td>${member.checkIn || '-'}</td>
        <td>${member.checkOut || '-'}</td>
        <td>
          <button class="btn-action btn-view" onclick="viewMemberDetails(${member.id})" style="background: var(--accent); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
            <i class="fas fa-eye"></i> عرض
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterMembers(filter) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  
  loadMembersTable(filter);
}

function viewMemberDetails(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  
  let attendanceSummary = 'لا يوجد سجل حضور';
  if (member.attendance && member.attendance.length > 0) {
    const total = member.attendance.length;
    const onTime = member.attendance.filter(a => a.status === 'onTime').length;
    attendanceSummary = `${total} يوم حضور، ${onTime} في الموعد`;
  }
  
  const details = `
    <div style="text-align: right; line-height: 1.8;">
      <h3 style="color: var(--accent); margin-bottom: 20px;">📋 ${member.name}</h3>
      
      <div style="background: var(--bg-secondary); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
        <h4 style="margin-bottom: 15px;">معلومات أساسية</h4>
        <p><strong>📱 الواتساب:</strong> ${member.whatsapp}</p>
        <p><strong>📧 البريد:</strong> ${member.email}</p>
        <p><strong>📅 يوم الإجازة:</strong> ${member.dayOff}</p>
        <p><strong>🕐 وقت الحضور:</strong> ${member.checkIn}</p>
        <p><strong>🕔 وقت الانصراف:</strong> ${member.checkOut}</p>
      </div>
      
      <div style="background: var(--bg-secondary); padding: 20px; border-radius: 10px;">
        <h4 style="margin-bottom: 15px;">الإحصائيات</h4>
        <p><strong>📊 الحضور:</strong> ${attendanceSummary}</p>
      </div>
    </div>
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'viewMemberModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeViewMemberModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>تفاصيل الموظف</h2>
        <button class="modal-close" onclick="closeViewMemberModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        ${details}
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeViewMemberModal()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeViewMemberModal() {
  const modal = document.getElementById('viewMemberModal');
  if (modal) modal.remove();
}

// Submit Task (Leader)
async function submitTask() {
  const memberId = parseInt(document.getElementById('taskMember').value);
  const type = document.getElementById('taskType').value;
  const details = document.getElementById('taskDetails').value;
  
  if (!memberId || !type || !details) {
    alert('يرجى ملء جميع الحقول!');
    return;
  }
  
  const member = appData.members.find(m => m.id === memberId);
  const leader = appData.leaders.find(l => l.id === appData.currentUser.id);
  
  if (!member || !leader) {
    alert('حدث خطأ!');
    return;
  }
  
  const newTask = {
    id: Date.now(),
    memberId,
    memberName: member.name,
    type,
    details,
    assignedBy: leader.name,
    date: Date.now(),
    status: 'pending'
  };
  
  if (!appData.tasks) appData.tasks = [];
  appData.tasks.push(newTask);
  await saveStorage(appData);
  
  alert('✅ تم إسناد المهمة بنجاح!');
  document.getElementById('taskForm').reset();
  loadLeaderTasks();
}

function loadLeaderTasks() {
  const container = document.getElementById('allTasks');
  if (!container) return;
  
  if (!appData.tasks || appData.tasks.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i><p>لا توجد مهام مسندة</p></div>';
    return;
  }
  
  const sortedTasks = [...appData.tasks].sort((a, b) => b.date - a.date);
  
  container.innerHTML = sortedTasks.map(task => `
    <div class="task-item" style="background: var(--bg-secondary); padding: 20px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
      <h4 style="color: var(--text-primary); margin-bottom: 10px;">${task.details}</h4>
      <p style="color: var(--text-secondary); font-size: 14px; margin: 5px 0;"><i class="fas fa-user"></i> الموظف: ${task.memberName}</p>
      <p style="color: var(--text-secondary); font-size: 14px; margin: 5px 0;"><i class="fas fa-user-tie"></i> مُسند بواسطة: ${task.assignedBy}</p>
      <span class="task-type" style="display: inline-block; background: var(--accent); color: white; padding: 5px 12px; border-radius: 5px; font-size: 12px; margin-top: 10px;">${task.type}</span>
      <p style="color: var(--text-secondary); font-size: 12px; margin-top: 10px;">
        <i class="fas fa-calendar"></i> ${new Date(task.date).toLocaleDateString('ar-EG')}
      </p>
      <button class="btn-action btn-delete" onclick="deleteTask(${task.id})" style="margin-top: 10px; width: 100%; background: #dc3545; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
        <i class="fas fa-trash"></i> حذف المهمة
      </button>
    </div>
  `).join('');
}

async function deleteTask(taskId) {
  if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
  
  appData.tasks = appData.tasks.filter(t => t.id !== taskId);
  await saveStorage(appData);
  
  alert('تم الحذف بنجاح!');
  
  if (appData.currentUser.role === 'leader') {
    loadLeaderTasks();
  } else {
    loadAdminTasks();
  }
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function loadAdminDashboard() {
  // Calculate stats
  const now = new Date();
  const currentHour = now.getHours();
  
  let presentCount = 0;
  let absentCount = 0;
  
  appData.members.forEach(m => {
    if (!m.checkIn || !m.checkOut) {
      absentCount++;
      return;
    }
    const [checkInHour] = m.checkIn.split(':').map(Number);
    const [checkOutHour] = m.checkOut.split(':').map(Number);
    
    if (currentHour >= checkInHour && currentHour < checkOutHour) {
      presentCount++;
    } else {
      absentCount++;
    }
  });
  
  document.getElementById('adminTotalMembers').textContent = appData.members.length;
  document.getElementById('adminTotalLeaders').textContent = appData.leaders.length;
  document.getElementById('adminPresentToday').textContent = presentCount;
  document.getElementById('adminAbsentToday').textContent = absentCount;
  
  // Load members table
  loadAdminMembersTable();
  
  // Load task member select
  const adminTaskMemberSelect = document.getElementById('adminTaskMember');
  if (adminTaskMemberSelect) {
    adminTaskMemberSelect.innerHTML = '<option value="">اختر الموظف</option>' + 
      appData.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  }
  
  // Load admin tasks
  loadAdminTasks();
  
  // Load requests
  loadAdminRequests();
}

function loadAdminMembersTable() {
  const tbody = document.getElementById('adminMembersTableBody');
  if (!tbody) return;
  
  if (appData.members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">لا توجد بيانات موظفين</td></tr>';
    return;
  }
  
  tbody.innerHTML = appData.members.map(member => `
    <tr>
      <td><strong>${member.name}</strong></td>
      <td>${member.whatsapp || '-'}</td>
      <td>${member.email || '-'}</td>
      <td>${member.dayOff || '-'}</td>
      <td>
        <div style="display: flex; gap: 5px; justify-content: center;">
          <button class="btn-action btn-view" onclick="viewMemberDetails(${member.id})" style="background: var(--accent); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 13px;">
            <i class="fas fa-eye"></i> عرض
          </button>
          <button class="btn-action btn-edit" onclick="editMember(${member.id})" style="background: #ffc107; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 13px;">
            <i class="fas fa-edit"></i> تعديل
          </button>
          <button class="btn-action btn-delete" onclick="deleteMember(${member.id})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 13px;">
            <i class="fas fa-trash"></i> حذف
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Admin Task Management
async function submitAdminTask() {
  const memberId = parseInt(document.getElementById('adminTaskMember').value);
  const type = document.getElementById('adminTaskType').value;
  const details = document.getElementById('adminTaskDetails').value;
  
  if (!memberId || !type || !details) {
    alert('يرجى ملء جميع الحقول!');
    return;
  }
  
  const member = appData.members.find(m => m.id === memberId);
  
  if (!member) {
    alert('حدث خطأ!');
    return;
  }
  
  const newTask = {
    id: Date.now(),
    memberId,
    memberName: member.name,
    type,
    details,
    assignedBy: 'المدير - فارس أكرم',
    date: Date.now(),
    status: 'pending'
  };
  
  if (!appData.tasks) appData.tasks = [];
  appData.tasks.push(newTask);
  await saveStorage(appData);
  
  alert('✅ تم إسناد المهمة بنجاح!');
  document.getElementById('adminTaskForm').reset();
  loadAdminTasks();
}

function loadAdminTasks() {
  const container = document.getElementById('adminAllTasks');
  if (!container) return;
  
  if (!appData.tasks || appData.tasks.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i><p>لا توجد مهام مسندة</p></div>';
    return;
  }
  
  const sortedTasks = [...appData.tasks].sort((a, b) => b.date - a.date);
  
  container.innerHTML = sortedTasks.map(task => `
    <div class="task-item" style="background: var(--bg-secondary); padding: 20px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
      <h4 style="color: var(--text-primary); margin-bottom: 10px;">${task.details}</h4>
      <p style="color: var(--text-secondary); font-size: 14px; margin: 5px 0;"><i class="fas fa-user"></i> الموظف: ${task.memberName}</p>
      <p style="color: var(--text-secondary); font-size: 14px; margin: 5px 0;"><i class="fas fa-user-tie"></i> مُسند بواسطة: ${task.assignedBy}</p>
      <span class="task-type" style="display: inline-block; background: var(--accent); color: white; padding: 5px 12px; border-radius: 5px; font-size: 12px; margin-top: 10px;">${task.type}</span>
      <p style="color: var(--text-secondary); font-size: 12px; margin-top: 10px;">
        <i class="fas fa-calendar"></i> ${new Date(task.date).toLocaleDateString('ar-EG')}
      </p>
      <button class="btn-action btn-delete" onclick="deleteTask(${task.id})" style="margin-top: 10px; width: 100%; background: #dc3545; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
        <i class="fas fa-trash"></i> حذف المهمة
      </button>
    </div>
  `).join('');
}

// Load Admin Requests
function loadAdminRequests() {
  const container = document.getElementById('adminRequests');
  const countEl = document.getElementById('requestsCount');
  
  if (!container) return;
  
  if (!appData.requests) appData.requests = [];
  
  const pendingRequests = appData.requests.filter(r => r.status === 'pending');
  
  if (countEl) {
    countEl.textContent = `${pendingRequests.length} طلب جديد`;
  }
  
  if (appData.requests.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i><p>لا توجد طلبات</p></div>';
    return;
  }
  
  const sortedRequests = [...appData.requests].sort((a, b) => b.date - a.date);
  
  container.innerHTML = sortedRequests.map(request => {
    const statusClass = request.status === 'pending' ? 'status-absent' : 
                       request.status === 'approved' ? 'status-present' : 'status-absent';
    const statusText = request.status === 'pending' ? 'قيد المراجعة' : 
                      request.status === 'approved' ? 'تمت الموافقة' : 'مرفوض';
    
    let requestDetails = '';
    if (request.type === 'exception') {
      requestDetails = `
        <p><strong>وقت المغادرة:</strong> ${request.time}</p>
        <p><strong>السبب:</strong> ${request.reason}</p>
      `;
    } else if (request.type === 'break') {
      requestDetails = `
        <p><strong>المدة:</strong> ${request.duration} دقيقة</p>
        ${request.notes ? `<p><strong>ملاحظات:</strong> ${request.notes}</p>` : ''}
      `;
    } else if (request.type === 'vacation') {
      requestDetails = `
        <p><strong>من:</strong> ${request.startDate}</p>
        <p><strong>إلى:</strong> ${request.endDate}</p>
        <p><strong>عدد الأيام:</strong> ${request.days}</p>
        <p><strong>السبب:</strong> ${request.reason}</p>
      `;
    }
    
    return `
      <div class="request-card" style="background: var(--bg-secondary); padding: 20px; border-radius: 10px; margin-bottom: 15px; border-right: 4px solid var(--accent);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
          <div>
            <h4 style="color: var(--text-primary); margin-bottom: 5px;">${request.memberName}</h4>
            <span style="display: inline-block; background: var(--accent); color: white; padding: 3px 10px; border-radius: 5px; font-size: 12px;">
              ${request.type === 'exception' ? 'استئذان' : request.type === 'break' ? 'بريك' : 'إجازة'}
            </span>
          </div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div style="color: var(--text-secondary); font-size: 14px; line-height: 1.8;">
          <p><strong>الواتساب:</strong> ${request.memberWhatsapp}</p>
          ${requestDetails}
          <p><strong>التاريخ:</strong> ${new Date(request.date).toLocaleString('ar-EG')}</p>
        </div>
        ${request.status === 'pending' ? `
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="approveRequest(${request.id})" style="flex: 1; background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-size: 14px;">
              <i class="fas fa-check"></i> قبول
            </button>
            <button onclick="rejectRequest(${request.id})" style="flex: 1; background: #dc3545; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-size: 14px;">
              <i class="fas fa-times"></i> رفض
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function approveRequest(requestId) {
  const request = appData.requests.find(r => r.id === requestId);
  if (!request) return;
  
  request.status = 'approved';
  await saveStorage(appData);
  
  alert('✅ تمت الموافقة على الطلب!');
  loadAdminRequests();
}

async function rejectRequest(requestId) {
  if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
  
  const request = appData.requests.find(r => r.id === requestId);
  if (!request) return;
  
  request.status = 'rejected';
  await saveStorage(appData);
  
  alert('تم رفض الطلب');
  loadAdminRequests();
}

// User Modal Functions
function openAddUserModal() {
  editingUserId = null;
  document.getElementById('userModalTitle').textContent = 'إضافة موظف جديد';
  document.getElementById('userModalForm').reset();
  document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
  editingUserId = null;
}

function editMember(memberId) {
  editingUserId = memberId;
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  
  document.getElementById('userModalTitle').textContent = 'تعديل بيانات الموظف';
  document.getElementById('modalName').value = member.name;
  document.getElementById('modalPassword').value = member.password;
  document.getElementById('modalWhatsapp').value = member.whatsapp || '';
  document.getElementById('modalEmail').value = member.email || '';
  document.getElementById('modalDayOff').value = member.dayOff || '';
  document.getElementById('modalCheckIn').value = member.checkIn || '';
  document.getElementById('modalCheckOut').value = member.checkOut || '';
  
  document.getElementById('userModal').classList.add('active');
}

async function submitUserModal() {
  const name = document.getElementById('modalName').value;
  const password = document.getElementById('modalPassword').value;
  const whatsapp = document.getElementById('modalWhatsapp').value;
  const email = document.getElementById('modalEmail').value;
  const dayOff = document.getElementById('modalDayOff').value;
  const checkIn = document.getElementById('modalCheckIn').value;
  const checkOut = document.getElementById('modalCheckOut').value;
  
  if (!name || !password || !whatsapp || !email || !dayOff || !checkIn || !checkOut) {
    alert('يرجى ملء جميع الحقول!');
    return;
  }
  
  if (editingUserId) {
    // Update existing member
    const member = appData.members.find(m => m.id === editingUserId);
    if (member) {
      member.name = name;
      member.password = password;
      member.whatsapp = whatsapp;
      member.email = email;
      member.dayOff = dayOff;
      member.checkIn = checkIn;
      member.checkOut = checkOut;
      
      await saveStorage(appData);
      alert('✅ تم التعديل بنجاح!');
    }
  } else {
    // Add new member
    const newMember = {
      id: Date.now(),
      name, password, whatsapp, email, dayOff, checkIn, checkOut,
      status: 'absent',
      attendance: [],
      requests: []
    };
    
    await FirebaseStorage.addMember(newMember);
    await reloadData();
    alert('✅ تم الإضافة بنجاح!');
  }
  
  closeUserModal();
  loadAdminMembersTable();
}

async function deleteMember(memberId) {
  if (!confirm('هل أنت متأكد من حذف هذا الموظف؟\nسيتم حذف جميع بياناته بشكل نهائي!')) return;
  
  appData.members = appData.members.filter(m => m.id !== memberId);
  appData.tasks = appData.tasks.filter(t => t.memberId !== memberId);
  await saveStorage(appData);
  
  alert('✅ تم الحذف بنجاح!');
  loadAdminMembersTable();
}

// Export Data
function exportData() {
  if (appData.members.length === 0) {
    alert('لا يوجد موظفين لتصديرهم!');
    return;
  }
  
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += 'الاسم,الواتساب,البريد,يوم الإجازة,وقت الحضور,وقت الانصراف\n';
  
  appData.members.forEach(member => {
    csvContent += `${member.name},${member.whatsapp},${member.email},${member.dayOff},${member.checkIn},${member.checkOut}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `بيانات_الموظفين_${date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('✅ تم تصدير البيانات بنجاح!');
}

// Logout
async function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    await FirebaseStorage.clearCurrentUser();
    location.reload();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeApp);

// Global functions
window.logout = logout;
window.toggleDarkMode = toggleDarkMode;
window.reloadData = reloadData;
window.saveStorage = saveStorage;
window.recordCheckIn = recordCheckIn;
window.recordCheckOut = recordCheckOut;
window.openExceptionModal = openExceptionModal;
window.closeExceptionModal = closeExceptionModal;
window.openBreakModal = openBreakModal;
window.closeBreakModal = closeBreakModal;
window.openVacationModal = openVacationModal;
window.closeVacationModal = closeVacationModal;
window.submitException = submitException;
window.submitBreak = submitBreak;
window.submitVacation = submitVacation;
window.submitTask = submitTask;
window.submitAdminTask = submitAdminTask;
window.deleteTask = deleteTask;
window.filterMembers = filterMembers;
window.viewMemberDetails = viewMemberDetails;
window.closeViewMemberModal = closeViewMemberModal;
window.openAddUserModal = openAddUserModal;
window.closeUserModal = closeUserModal;
window.editMember = editMember;
window.submitUserModal = submitUserModal;
window.deleteMember = deleteMember;
window.exportData = exportData;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;

console.log('✅ System.js loaded successfully with Firebase!');
