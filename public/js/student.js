/* ============================================
   STUDENT DASHBOARD FUNCTIONALITY
   ============================================ */

const StudentAPI = {
  async getProfile() {
    return API.get('/api/student/profile');
  },

  async updateProfile(formData) {
    return API.upload('/api/student/profile', formData);
  },

  async getJobs(params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`/api/student/jobs${query.toString() ? `?${query.toString()}` : ''}`);
  },

  async getCourses(params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`/api/student/courses${query.toString() ? `?${query.toString()}` : ''}`);
  },

  async getInternships(params = {}) {
    const query = new URLSearchParams(params);
    return API.get(`/api/student/internships${query.toString() ? `?${query.toString()}` : ''}`);
  },

  async apply(targetType, targetId) {
    return API.post('/api/student/apply', { targetType, targetId });
  },

  async getApplications() {
    return API.get('/api/student/applications');
  },

  async deleteApplication(applicationId) {
    return API.delete(`/api/student/applications/${applicationId}`);
  },

  // Wishlist API
  async getWishlist() {
    return API.get('/api/student/wishlist');
  },

  async addToWishlist(courseId) {
    return API.post('/api/student/wishlist', { courseId });
  },

  async removeFromWishlist(courseId) {
    return API.delete(`/api/student/wishlist/${courseId}`);
  },

  // Extra courses CRUD
  async getExtraCourses() {
    return API.get('/api/student/extra-courses');
  },

  async addExtraCourse(courseData) {
    return API.post('/api/student/extra-courses', courseData);
  },

  async updateExtraCourse(id, courseData) {
    return API.put(`/api/student/extra-courses/${id}`, courseData);
  },

  async deleteExtraCourse(id) {
    return API.delete(`/api/student/extra-courses/${id}`);
  },

  // AI Chat API
  async sendChatMessage(message, context = {}) {
    return API.post('/api/student/ai-chat', { message, context });
  },

  async getChatHistory() {
    return API.get('/api/student/ai-chat/history');
  },

  async clearChatHistory() {
    return API.delete('/api/student/ai-chat/history');
  }
};

let currentOpportunityType = null;
let opportunitySearchTimeout = null;

// Load user info
async function loadUserInfo() {
  try {
    const profile = await StudentAPI.getProfile();
    const userInfo = document.getElementById('userInfo');
    if (userInfo && profile.name) {
      userInfo.textContent = `👤 ${profile.name}`;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
    // Don't show toast for this as it's not critical
  }
}

// Load and display profile
async function loadProfile() {
  try {
    Loading.show();
    const profile = await StudentAPI.getProfile();

    // Check if student is approved
    if (profile.approved === 1) {
      // Show profile card view
      displayProfileCard(profile);
      const profileView = document.getElementById('profileView');
      const studentForm = document.getElementById('studentProfileForm');
      const editBtn = document.getElementById('editProfileBtn');
      const cancelBtn = document.getElementById('cancelEditBtn');

      if (profileView) profileView.style.display = 'block';
      if (studentForm) studentForm.style.display = 'none';
      if (editBtn) editBtn.style.display = 'inline-flex';
      if (cancelBtn) cancelBtn.style.display = 'none';
    } else {
      // Show form for unapproved students
      loadProfileForEdit(profile);
      const profileView = document.getElementById('profileView');
      const studentForm = document.getElementById('studentProfileForm');
      const editBtn = document.getElementById('editProfileBtn');
      const cancelBtn = document.getElementById('cancelEditBtn');

      if (profileView) profileView.style.display = 'none';
      if (studentForm) studentForm.style.display = 'block';
      if (editBtn) editBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }

    Loading.hide();
  } catch (error) {
    Loading.hide();
    console.error('Failed to load profile:', error);
    if (error.message !== 'Missing token') {
      Toast.warning('Profile not found. Please complete your profile.');
    }
  }
}

// Load profile data into form for editing
function loadProfileForEdit(profile = null) {
  if (!profile) return;

  document.getElementById('registerNumber').value = profile.registerNumber || '';
  document.getElementById('department').value = profile.department || '';
  document.getElementById('yearOfStudy').value = profile.yearOfStudy || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('address').value = profile.address || '';
  document.getElementById('dateOfBirth').value = profile.dateOfBirth || '';
  document.getElementById('gender').value = profile.gender || '';
  document.getElementById('cgpa').value = profile.cgpa || '';
  document.getElementById('skills').value = profile.skills || '';
}

// Display profile in card format
function displayProfileCard(profile) {
  // Profile header
  const profileName = document.getElementById('profileName');
  const profileRegNum = document.getElementById('profileRegNum');
  
  if (profileName) profileName.textContent = profile.name || 'Student';
  if (profileRegNum) profileRegNum.textContent = profile.registerNumber || 'Not provided';

  // Profile photo
  const photoElement = document.getElementById('profilePhoto');
  if (photoElement) {
    if (profile.photoPath) {
      photoElement.src = profile.photoPath.startsWith('/') ? profile.photoPath : '/uploads/' + profile.photoPath;
    } else {
      photoElement.src = '/images/default-avatar.svg';
    }
  }

  // Profile status and approval section
  const statusElement = document.getElementById('profileStatus');
  const approvalSection = document.getElementById('approvalSection');

  if (statusElement) {
    if (profile.approved === 1) {
      statusElement.textContent = 'Approved';
      statusElement.className = 'badge badge-success';
      if (approvalSection) approvalSection.style.display = 'none';
    } else {
      statusElement.textContent = 'Pending Approval';
      statusElement.className = 'badge badge-warning';

      // Show approval request section if profile is complete
      const isProfileComplete = profile.registerNumber && profile.department && profile.name;
      if (approvalSection) approvalSection.style.display = isProfileComplete ? 'block' : 'none';
    }
  }

  // Profile details - with null checks
  const elements = {
    'profileDept': profile.department || '-',
    'profileYear': profile.yearOfStudy ? `${profile.yearOfStudy} Year` : '-',
    'profilePhone': profile.phone || '-',
    'profileCgpa': profile.cgpa || '-',
    'profileGender': profile.gender || '-',
    'profileDob': profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '-',
    'profileSkills': profile.skills || '-',
    'profileAddress': profile.address || '-'
  };

  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = elements[id];
  });

  // Resume link
  const resumeLink = document.getElementById('resumeLink');
  if (resumeLink) {
    if (profile.resumePath) {
      resumeLink.href = profile.resumePath.startsWith('/') ? profile.resumePath : '/uploads/' + profile.resumePath;
      resumeLink.style.display = 'inline';
    } else {
      resumeLink.style.display = 'none';
    }
  }
}

// Update stats
async function updateStats() {
  try {
    const applications = await StudentAPI.getApplications();
    const total = applications.length || 0;
    const approved = applications.filter(a => a.status === 'selected' || a.status === 'approved').length;
    const pending = applications.filter(a => a.status === 'applied' || a.status === 'pending').length;

    const totalEl = document.getElementById('totalApplications');
    const approvedEl = document.getElementById('approvedCount');
    const pendingEl = document.getElementById('pendingCount');

    if (totalEl) totalEl.textContent = total;
    if (approvedEl) approvedEl.textContent = approved;
    if (pendingEl) pendingEl.textContent = pending;
  } catch (error) {
    console.error('Failed to update stats:', error);
    // Don't show toast for stats as it's not critical
  }
}

// Display opportunities
function displayOpportunities(opportunities, type) {
  const container = document.getElementById('opportunitiesContainer');

  if (!opportunities || opportunities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No ${type} available</h3>
        <p>Check back later for new opportunities</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="opportunities-grid">
      ${opportunities.map(opp => `
        <div class="opportunity-card">
          <h4>${opp.title}</h4>
          <div class="meta">
            <span class="meta-item">🏢 ${opp.companyName || 'Company'}</span>
            ${opp.department ? `<span class="meta-item">📚 ${opp.department}</span>` : ''}
            <span class="badge badge-primary">${type === 'jobs' ? 'Job' : type === 'courses' ? 'Course' : 'Internship'}</span>
          </div>
          <p class="description">${opp.description || 'No description available'}</p>
          ${opp.requiredSkills ? `<p><strong>Skills:</strong> ${opp.requiredSkills}</p>` : ''}
          ${opp.fees ? `<p><strong>Fees:</strong> ₹${opp.fees}</p>` : ''}
          ${opp.stipend ? `<p><strong>Stipend:</strong> ₹${opp.stipend}</p>` : ''}
          ${opp.duration ? `<p><strong>Duration:</strong> ${opp.duration}</p>` : ''}
          <div class="btn-group mt-2">
            <button class="btn btn-primary btn-sm" onclick="applyForOpportunity('${type === 'jobs' ? 'job' : type === 'courses' ? 'course' : 'internship'}', ${opp.id})">
              Apply Now
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Display applications
function displayApplications(applications) {
  const container = document.getElementById('applicationsContainer');

  if (!applications || applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No applications yet</h3>
        <p>Apply for jobs or courses to see them here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-actions" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <button class="btn btn-outline btn-sm" id="selectAllApplications">Select All</button>
          <button class="btn btn-danger btn-sm" id="deleteSelectedApplications" style="display: none;">Delete Selected</button>
        </div>
        <div class="text-muted">
          <small>Note: Approved/Selected applications cannot be deleted</small>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th width="40">
              <input type="checkbox" id="selectAllCheckbox" title="Select All">
            </th>
            <th>Type</th>
            <th>Title</th>
            <th>Company</th>
            <th>Status</th>
            <th>Applied Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => `
            <tr>
              <td>
                ${app.status === 'selected' || app.status === 'approved' ? 
                  '<input type="checkbox" disabled title="Cannot select approved applications">' :
                  `<input type="checkbox" class="app-checkbox" data-app-id="${app.id}" title="Select for deletion">`
                }
              </td>
              <td><span class="badge badge-info">${app.targetType === 'job' ? 'Job' : app.targetType === 'course' ? 'Course' : 'Internship'}</span></td>
              <td>${app.title || 'N/A'}</td>
              <td>${app.companyName || 'N/A'}</td>
              <td>
                <span class="badge ${app.status === 'selected' || app.status === 'approved' ? 'badge-success' :
      app.status === 'rejected' ? 'badge-danger' :
        'badge-warning'
    }">
                  ${app.status || 'Applied'}
                </span>
              </td>
              <td>${formatDate(app.createdAt)}</td>
              <td>
                ${app.status === 'selected' || app.status === 'approved' ? 
                  '<span class="text-muted" title="Approved/Selected applications cannot be deleted">🔒 Protected</span>' : 
                  app.status === 'rejected' ? 
                    `<button class="btn btn-danger btn-sm" onclick="deleteApplication(${app.id})" title="Delete Rejected Application">
                      🗑️ Delete
                    </button>` :
                    `<button class="btn btn-danger btn-sm" onclick="deleteApplication(${app.id})" title="Delete Application">
                      🗑️ Delete
                    </button>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Add event listeners for bulk operations
  setupBulkDeleteListeners();
}

// Apply for opportunity
async function applyForOpportunity(targetType, targetId) {
  try {
    Loading.show();
    const result = await StudentAPI.apply(targetType, targetId);
    Loading.hide();
    Toast.success(result.message || 'Application submitted successfully!');
    await updateStats();
    await loadApplications();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to submit application');
  }
}

function getOpportunitySearchQuery() {
  const searchInput = document.getElementById('opportunitySearch');
  return (searchInput?.value || '').trim().toLowerCase();
}

function filterOpportunitiesBySearch(opportunities, query) {
  if (!query) return opportunities;

  return opportunities.filter((opp) => {
    const haystack = [
      opp.title,
      opp.companyName,
      opp.department,
      opp.requiredSkills,
      opp.description,
      opp.category,
      opp.platform
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

function reloadCurrentOpportunityList() {
  if (currentOpportunityType === 'jobs') {
    loadJobs();
  } else if (currentOpportunityType === 'courses') {
    loadCourses();
  } else if (currentOpportunityType === 'internships') {
    loadInternships();
  }
}

// Load jobs
async function loadJobs() {
  try {
    currentOpportunityType = 'jobs';
    Loading.show();
    const dept = document.getElementById('filterDepartment').value;
    const searchQuery = getOpportunitySearchQuery();
    const jobs = await StudentAPI.getJobs({
      department: dept,
      search: searchQuery
    });
    Loading.hide();

    displayOpportunities(jobs, 'jobs');
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load jobs');
  }
}

// Load courses
async function loadCourses() {
  try {
    currentOpportunityType = 'courses';
    Loading.show();
    const dept = document.getElementById('filterDepartment').value;
    const searchQuery = getOpportunitySearchQuery();
    const courses = await StudentAPI.getCourses({
      department: dept,
      search: searchQuery
    });
    Loading.hide();

    displayOpportunities(courses, 'courses');
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load courses');
  }
}

// Load internships
async function loadInternships() {
  try {
    currentOpportunityType = 'internships';
    Loading.show();
    const dept = document.getElementById('filterDepartment').value;
    const searchQuery = getOpportunitySearchQuery();
    const internships = await StudentAPI.getInternships({
      department: dept,
      search: searchQuery
    });
    Loading.hide();

    displayOpportunities(internships, 'internships');
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load internships');
  }
}

// Load applications
async function loadApplications() {
  try {
    Loading.show();
    const applications = await StudentAPI.getApplications();
    Loading.hide();
    displayApplications(applications);
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to load applications');
  }
}

// Load wishlist
async function loadWishlist() {
  try {
    Loading.show();
    const wishlistResponse = await StudentAPI.getWishlist();
    const wishlist = wishlistResponse.value || wishlistResponse || [];
    Loading.hide();
    displayWishlist(wishlist);
  } catch (error) {
    Loading.hide();
    console.error('Failed to load wishlist:', error);
    Toast.error(error.message || 'Failed to load wishlist');
  }
}

// Display wishlist
function displayWishlist(wishlist) {
  const container = document.getElementById('wishlistContainer');

  if (!wishlist || wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❤️</div>
        <h3>No wishlist items</h3>
        <p>Add courses to wishlist from the opportunities section.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Course Title</th>
            <th>Company</th>
            <th>Department</th>
            <th>Category</th>
            <th>Platform</th>
            <th>Fees</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${wishlist.map(course => `
            <tr>
              <td>${course.title || 'N/A'}</td>
              <td>${course.companyName || 'N/A'}</td>
              <td>${course.department || 'N/A'}</td>
              <td>${course.category || 'N/A'}</td>
              <td>${course.platform || 'N/A'}</td>
              <td>${course.fees ? '₹' + course.fees : 'N/A'}</td>
              <td>${course.duration || 'N/A'}</td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="removeFromWishlistAndReload(${course.courseId})" title="Remove from wishlist">
                  🗑️ Remove
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Remove from wishlist and reload
async function removeFromWishlistAndReload(courseId) {
  try {
    Loading.show();
    const result = await StudentAPI.removeFromWishlist(courseId);
    Loading.hide();
    Toast.success(result.message || 'Removed from wishlist');
    await loadWishlist();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to remove from wishlist');
  }
}

// Delete application
async function deleteApplication(applicationId) {
  // Create a custom confirmation modal for better UX
  const confirmed = await showDeleteConfirmation(
    'Delete Application',
    'Are you sure you want to delete this application? This action cannot be undone.',
    'Delete',
    'Cancel'
  );

  if (!confirmed) return;

  try {
    Loading.show();
    const result = await StudentAPI.deleteApplication(applicationId);
    Loading.hide();
    Toast.success(result.message || 'Application deleted successfully');
    
    // Refresh applications and stats
    await loadApplications();
    await updateStats();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to delete application');
  }
}

// Show delete confirmation dialog
function showDeleteConfirmation(title, message, confirmText, cancelText) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelDelete">${cancelText}</button>
          <button class="btn btn-danger" id="confirmDelete">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle button clicks
    const confirmBtn = modal.querySelector('#confirmDelete');
    const cancelBtn = modal.querySelector('#cancelDelete');

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
  });
}

// Setup bulk delete listeners
function setupBulkDeleteListeners() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectAllBtn = document.getElementById('selectAllApplications');
  const deleteSelectedBtn = document.getElementById('deleteSelectedApplications');
  const appCheckboxes = document.querySelectorAll('.app-checkbox');

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      appCheckboxes.forEach(checkbox => {
        if (!checkbox.disabled) {
          checkbox.checked = e.target.checked;
        }
      });
      updateDeleteButtonVisibility();
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const allChecked = Array.from(appCheckboxes).every(cb => cb.checked || cb.disabled);
      appCheckboxes.forEach(checkbox => {
        if (!checkbox.disabled) {
          checkbox.checked = !allChecked;
        }
      });
      if (selectAllCheckbox) selectAllCheckbox.checked = !allChecked;
      updateDeleteButtonVisibility();
    });
  }

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', deleteSelectedApplications);
  }

  // Add change listeners to individual checkboxes
  appCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateDeleteButtonVisibility);
  });
}

// Update delete button visibility
function updateDeleteButtonVisibility() {
  const deleteBtn = document.getElementById('deleteSelectedApplications');
  const checkedBoxes = document.querySelectorAll('.app-checkbox:checked');
  
  if (deleteBtn) {
    deleteBtn.style.display = checkedBoxes.length > 0 ? 'inline-flex' : 'none';
    deleteBtn.textContent = `Delete Selected (${checkedBoxes.length})`;
  }
}

// Delete selected applications
async function deleteSelectedApplications() {
  const checkedBoxes = document.querySelectorAll('.app-checkbox:checked');
  const applicationIds = Array.from(checkedBoxes).map(cb => cb.dataset.appId);

  if (applicationIds.length === 0) {
    Toast.warning('No applications selected');
    return;
  }

  const confirmed = await showDeleteConfirmation(
    'Delete Multiple Applications',
    `Are you sure you want to delete ${applicationIds.length} application(s)? This action cannot be undone.`,
    `Delete ${applicationIds.length} Applications`,
    'Cancel'
  );

  if (!confirmed) return;

  try {
    Loading.show();
    
    // Delete applications one by one
    const deletePromises = applicationIds.map(id => StudentAPI.deleteApplication(id));
    const results = await Promise.allSettled(deletePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    Loading.hide();

    if (successful > 0) {
      Toast.success(`Successfully deleted ${successful} application(s)`);
    }
    if (failed > 0) {
      Toast.error(`Failed to delete ${failed} application(s)`);
    }

    // Refresh applications and stats
    await loadApplications();
    await updateStats();
  } catch (error) {
    Loading.hide();
    Toast.error('Failed to delete applications');
  }
}

// ============================================
// AI CHAT FUNCTIONALITY
// ============================================

let chatHistory = [];
let isChatOpen = false;

// Toggle AI chat interface
function toggleAIChat() {
  const container = document.getElementById('aiChatContainer');
  const placeholder = document.getElementById('aiChatPlaceholder');
  const toggleBtn = document.getElementById('toggleAIChat');

  isChatOpen = !isChatOpen;

  if (isChatOpen) {
    container.style.display = 'block';
    placeholder.style.display = 'none';
    toggleBtn.textContent = '❌ Close Chat';
    loadChatHistory();
  } else {
    container.style.display = 'none';
    placeholder.style.display = 'block';
    toggleBtn.textContent = '💬 Open Chat';
  }
}

// Load chat history
async function loadChatHistory() {
  try {
    const history = await StudentAPI.getChatHistory();
    chatHistory = history || [];
    displayChatHistory();
  } catch (error) {
    console.error('Failed to load chat history:', error);
    chatHistory = [];
  }
}

// Display chat history
function displayChatHistory() {
  const messagesContainer = document.getElementById('chatMessages');
  
  // Keep the welcome message and add history
  const welcomeMessage = messagesContainer.querySelector('.ai-message');
  messagesContainer.innerHTML = '';
  
  if (welcomeMessage && chatHistory.length === 0) {
    messagesContainer.appendChild(welcomeMessage);
  }

  chatHistory.forEach(chat => {
    if (chat.userMessage) {
      addMessageToChat(chat.userMessage, 'user', false);
    }
    if (chat.aiResponse) {
      addMessageToChat(chat.aiResponse, 'ai', false);
    }
  });

  scrollChatToBottom();
}

// Add message to chat
function addMessageToChat(message, sender, animate = true) {
  const messagesContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
  
  if (animate) {
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
  }

  messageDiv.innerHTML = `
    <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
    <div class="message-content">
      ${formatMessage(message)}
    </div>
  `;

  messagesContainer.appendChild(messageDiv);

  if (animate) {
    setTimeout(() => {
      messageDiv.style.transition = 'all 0.3s ease-out';
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translateY(0)';
    }, 50);
  }

  scrollChatToBottom();
}

// Format message content
function formatMessage(message) {
  // Convert markdown-like formatting to HTML
  let formatted = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  // Convert bullet points
  formatted = formatted.replace(/^- (.*$)/gim, '<li>$1</li>');
  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  // Convert numbered lists
  formatted = formatted.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  if (formatted.includes('<li>') && !formatted.includes('<ul>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  }

  return `<p>${formatted}</p>`;
}

// Show typing indicator
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message typing-indicator';
  typingDiv.id = 'typingIndicator';
  
  typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span>AI is thinking</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;

  messagesContainer.appendChild(typingDiv);
  scrollChatToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send chat message
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;

  const sendBtn = document.getElementById('sendChatMessage');
  const sendText = document.getElementById('sendButtonText');
  const sendLoading = document.getElementById('sendButtonLoading');

  try {
    // Disable input and show loading
    input.disabled = true;
    sendBtn.disabled = true;
    sendText.style.display = 'none';
    sendLoading.style.display = 'inline';

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Get student context for better AI responses
    let context = {};
    try {
      const profile = await StudentAPI.getProfile();
      context = {
        department: profile.department,
        yearOfStudy: profile.yearOfStudy,
        skills: profile.skills,
        cgpa: profile.cgpa
      };
      console.log('Student context:', context);
    } catch (profileError) {
      console.warn('Could not load profile for context:', profileError);
    }

    console.log('Sending message to AI:', message);
    console.log('With context:', context);

    // Send message to AI
    const response = await StudentAPI.sendChatMessage(message, context);
    
    console.log('AI response received:', response);
    
    // Remove typing indicator and add AI response
    removeTypingIndicator();
    addMessageToChat(response.message, 'ai');

    // Update chat history
    chatHistory.push({
      userMessage: message,
      aiResponse: response.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    removeTypingIndicator();
    console.error('Failed to send message:', error);
    
    // Show more specific error message
    let errorMessage = 'Sorry, I encountered an error. Please try again later.';
    if (error.message) {
      console.error('Error details:', error.message);
      errorMessage = `Error: ${error.message}. Please try rephrasing your question.`;
    }
    
    addMessageToChat(errorMessage, 'ai');
    Toast.error('Failed to send message');
  } finally {
    // Re-enable input
    input.disabled = false;
    sendBtn.disabled = false;
    sendText.style.display = 'inline';
    sendLoading.style.display = 'none';
    input.focus();
  }
}

// Clear chat history
async function clearChatHistory() {
  if (!confirm('Are you sure you want to clear your chat history? This action cannot be undone.')) {
    return;
  }

  try {
    await StudentAPI.clearChatHistory();
    chatHistory = [];
    
    // Reset chat interface
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
      <div class="ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <p>Hello! I'm your AI Study Assistant. I can help you with:</p>
          <ul>
            <li>📚 Course information and recommendations</li>
            <li>❓ Clearing doubts about subjects</li>
            <li>💼 Career guidance and job preparation</li>
            <li>📝 Study tips and learning strategies</li>
            <li>🎯 Skill development suggestions</li>
          </ul>
          <p>What would you like to know today?</p>
        </div>
      </div>
    `;
    
    Toast.success('Chat history cleared successfully');
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    Toast.error('Failed to clear chat history');
  }
}

// Scroll chat to bottom
function scrollChatToBottom() {
  const messagesContainer = document.getElementById('chatMessages');
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

// Handle quick questions
function handleQuickQuestion(question) {
  const input = document.getElementById('chatInput');
  input.value = question;
  sendChatMessage();
}

// ============================================
// EXTRA COURSES MANAGEMENT
// ============================================

// Load extra courses
async function loadExtraCourses() {
  try {
    Loading.show();
    const courses = await StudentAPI.getExtraCourses();
    Loading.hide();
    displayExtraCourses(courses);
  } catch (error) {
    Loading.hide();
    console.error('Failed to load extra courses:', error);
  }
}

// Display extra courses
function displayExtraCourses(courses) {
  const container = document.getElementById('extraCoursesContainer');

  if (!courses || courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <h3>No extra courses added</h3>
        <p>Add your additional courses, certifications, and online learning</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Platform</th>
            <th>Category</th>
            <th>Credits</th>
            <th>Status</th>
            <th>Grade</th>
            <th>Completion Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${courses.map(course => `
            <tr>
              <td>
                ${course.courseName}
                ${course.certificateUrl ? `<a href="${course.certificateUrl}" target="_blank" class="text-primary" title="View Certificate">🔗</a>` : ''}
              </td>
              <td>${course.platform || '-'}</td>
              <td><span class="badge badge-info">${course.category || '-'}</span></td>
              <td>${course.credits || 0}</td>
              <td>
                <span class="badge ${course.status === 'completed' ? 'badge-success' :
      course.status === 'dropped' ? 'badge-danger' :
        'badge-warning'
    }">
                  ${course.status === 'in_progress' ? 'In Progress' : course.status || 'In Progress'}
                </span>
              </td>
              <td>${course.grade || '-'}</td>
              <td>${course.completionDate ? formatDate(course.completionDate) : '-'}</td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-outline btn-sm" onclick="editExtraCourse(${course.id})">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteExtraCourse(${course.id})">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Show extra course modal
function showExtraCourseModal(course = null) {
  const modal = document.getElementById('extraCourseModal');
  const title = document.getElementById('extraCourseModalTitle');
  const form = document.getElementById('extraCourseForm');

  // Reset form
  form.reset();
  document.getElementById('extraCourseId').value = '';

  if (course) {
    title.textContent = 'Edit Extra Course';
    document.getElementById('extraCourseId').value = course.id;
    document.getElementById('extraCourseName').value = course.courseName || '';
    document.getElementById('extraCoursePlatform').value = course.platform || '';
    document.getElementById('extraCourseCategory').value = course.category || '';
    document.getElementById('extraCourseCredits').value = course.credits || 0;
    document.getElementById('extraCourseCompletionDate').value = course.completionDate || '';
    document.getElementById('extraCourseGrade').value = course.grade || '';
    document.getElementById('extraCourseStatus').value = course.status || 'in_progress';
    document.getElementById('extraCourseCertificateUrl').value = course.certificateUrl || '';
  } else {
    title.textContent = 'Add Extra Course';
  }

  modal.style.display = 'flex';
}

// Hide extra course modal
function hideExtraCourseModal() {
  document.getElementById('extraCourseModal').style.display = 'none';
}

// Edit extra course
async function editExtraCourse(id) {
  try {
    Loading.show();
    const courses = await StudentAPI.getExtraCourses();
    Loading.hide();
    const course = courses.find(c => c.id === id);
    if (course) {
      showExtraCourseModal(course);
    }
  } catch (error) {
    Loading.hide();
    Toast.error('Failed to load course details');
  }
}

// Delete extra course
async function deleteExtraCourse(id) {
  if (!confirm('Are you sure you want to delete this course?')) return;

  try {
    Loading.show();
    await StudentAPI.deleteExtraCourse(id);
    Loading.hide();
    Toast.success('Course deleted successfully');
    await loadExtraCourses();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to delete course');
  }
}

// Save extra course (add or update)
async function saveExtraCourse(formData) {
  const id = document.getElementById('extraCourseId').value;
  const courseData = {
    courseName: formData.get('courseName'),
    platform: formData.get('platform'),
    category: formData.get('category'),
    credits: parseInt(formData.get('credits')) || 0,
    completionDate: formData.get('completionDate') || null,
    grade: formData.get('grade'),
    status: formData.get('status'),
    certificateUrl: formData.get('certificateUrl')
  };

  try {
    Loading.show();
    if (id) {
      await StudentAPI.updateExtraCourse(id, courseData);
      Toast.success('Course updated successfully');
    } else {
      await StudentAPI.addExtraCourse(courseData);
      Toast.success('Course added successfully');
    }
    Loading.hide();
    hideExtraCourseModal();
    await loadExtraCourses();
  } catch (error) {
    Loading.hide();
    Toast.error(error.message || 'Failed to save course');
  }
}

// Logout
function logout() {
  API.setToken(null);
  Toast.info('Logged out successfully');
  setTimeout(() => window.location.href = '/', 1000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!checkAuth()) return;

    console.log('🚀 Initializing student dashboard...');

    // Load initial data
    await loadUserInfo();
    await loadProfile();
    await updateStats();
    await loadApplications();
    await loadWishlist();
    await loadExtraCourses();

    console.log('✅ Student dashboard initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing dashboard:', error);
    Toast.error('Failed to initialize dashboard: ' + error.message);
  }

  // Profile form handler
  const profileForm = document.getElementById('studentProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Saving...';

        const formData = new FormData(profileForm);
        const result = await StudentAPI.updateProfile(formData);

        Toast.success(result.message || 'Profile updated successfully!');
        await loadProfile();
      } catch (error) {
        Toast.error(error.message || 'Failed to update profile');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Event listeners
  const loadJobsBtn = document.getElementById('loadJobs');
  const loadCoursesBtn = document.getElementById('loadCourses');
  const loadInternshipsBtn = document.getElementById('loadInternships');
  const refreshApplicationsBtn = document.getElementById('refreshApplications');
  const filterDepartmentSelect = document.getElementById('filterDepartment');

  if (loadJobsBtn) loadJobsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadJobs();
  });
  if (loadCoursesBtn) loadCoursesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadCourses();
  });
  if (loadInternshipsBtn) loadInternshipsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadInternships();
  });
  if (refreshApplicationsBtn) refreshApplicationsBtn.addEventListener('click', loadApplications);
  
  const refreshWishlistBtn = document.getElementById('refreshWishlistBtn');
  if (refreshWishlistBtn) refreshWishlistBtn.addEventListener('click', loadWishlist);
  
  if (filterDepartmentSelect) {
    filterDepartmentSelect.addEventListener('change', reloadCurrentOpportunityList);
  }

  const opportunitySearchInput = document.getElementById('opportunitySearch');
  const clearOpportunitySearchBtn = document.getElementById('clearOpportunitySearch');

  if (opportunitySearchInput) {
    opportunitySearchInput.addEventListener('input', () => {
      if (opportunitySearchTimeout) clearTimeout(opportunitySearchTimeout);
      opportunitySearchTimeout = setTimeout(() => {
        reloadCurrentOpportunityList();
      }, 250);
    });
  }

  if (clearOpportunitySearchBtn) {
    clearOpportunitySearchBtn.addEventListener('click', () => {
      if (opportunitySearchInput) {
        opportunitySearchInput.value = '';
      }
      reloadCurrentOpportunityList();
    });
  }

  // AI Chat event listeners
  const toggleAIChatBtn = document.getElementById('toggleAIChat');
  const clearChatHistoryBtn = document.getElementById('clearChatHistory');
  const sendChatBtn = document.getElementById('sendChatMessage');
  const chatInput = document.getElementById('chatInput');

  if (toggleAIChatBtn) toggleAIChatBtn.addEventListener('click', toggleAIChat);
  if (clearChatHistoryBtn) clearChatHistoryBtn.addEventListener('click', clearChatHistory);
  if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Quick question buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-question-btn')) {
      const question = e.target.dataset.question;
      handleQuickQuestion(question);
    }
  });

  // Profile edit/view toggle
  const editProfileBtn = document.getElementById('editProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', async () => {
      document.getElementById('profileView').style.display = 'none';
      document.getElementById('studentProfileForm').style.display = 'block';
      document.getElementById('editProfileBtn').style.display = 'none';
      document.getElementById('cancelEditBtn').style.display = 'inline-flex';

      // Load current profile data into form
      try {
        const profile = await StudentAPI.getProfile();
        loadProfileForEdit(profile);
      } catch (error) {
        console.error('Failed to load profile for editing:', error);
      }
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      document.getElementById('profileView').style.display = 'block';
      document.getElementById('studentProfileForm').style.display = 'none';
      document.getElementById('editProfileBtn').style.display = 'inline-flex';
      document.getElementById('cancelEditBtn').style.display = 'none';
    });
  }

  // Extra courses event listeners
  const addExtraCourseBtn = document.getElementById('addExtraCourseBtn');
  const closeExtraCourseModal = document.getElementById('closeExtraCourseModal');
  const cancelExtraCourseBtn = document.getElementById('cancelExtraCourseBtn');

  if (addExtraCourseBtn) {
    addExtraCourseBtn.addEventListener('click', () => {
      showExtraCourseModal();
    });
  }

  if (closeExtraCourseModal) closeExtraCourseModal.addEventListener('click', hideExtraCourseModal);
  if (cancelExtraCourseBtn) cancelExtraCourseBtn.addEventListener('click', hideExtraCourseModal);

  // Extra course form handler
  const extraCourseForm = document.getElementById('extraCourseForm');
  if (extraCourseForm) {
    extraCourseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(extraCourseForm);
      await saveExtraCourse(formData);
    });
  }

  // Close modal when clicking outside
  const extraCourseModal = document.getElementById('extraCourseModal');
  if (extraCourseModal) {
    extraCourseModal.addEventListener('click', (e) => {
      if (e.target.id === 'extraCourseModal') {
        hideExtraCourseModal();
      }
    });
  }
});
