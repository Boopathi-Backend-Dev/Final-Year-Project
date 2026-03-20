/* ============================================
   AUTHENTICATION HANDLERS
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Check for token in URL params (for Google OAuth)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    API.setToken(token);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Check if Google auth is enabled and show/hide button
  try {
    const googleAuth = await API.get('/api/auth/google-enabled');
    const googleBtn = document.querySelector('a[href="/api/auth/google"]');
    if (googleBtn) {
      googleBtn.style.display = googleAuth.enabled ? 'inline-block' : 'none';
    }
  } catch (e) {
    // Hide Google button if check fails
    const googleBtn = document.querySelector('a[href="/api/auth/google"]');
    if (googleBtn) {
      googleBtn.style.display = 'none';
    }
  }

  // Show/hide fields based on role selection
  const roleSelect = document.getElementById('regRole');
  const companyNameGroup = document.getElementById('companyNameGroup');
  const collegeCodeGroup = document.getElementById('collegeCodeGroup');

  if (roleSelect) {
    const handleRoleChange = (e) => {
      const role = e.target.value;
      if (companyNameGroup) {
        companyNameGroup.style.display = role === 'company' ? 'block' : 'none';
        const companyInput = companyNameGroup.querySelector('input');
        if (companyInput) {
          companyInput.required = role === 'company';
          if (role !== 'company') companyInput.value = '';
        }
      }
      if (collegeCodeGroup) {
        collegeCodeGroup.style.display = (role === 'student' || role === 'staff') ? 'block' : 'none';
        const collegeInput = collegeCodeGroup.querySelector('input');
        if (collegeInput) {
          collegeInput.required = role === 'student' || role === 'staff';
          if (role !== 'student' && role !== 'staff') collegeInput.value = '';
        }
      }
    };

    roleSelect.addEventListener('change', handleRoleChange);
    handleRoleChange({ target: roleSelect });
  }

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Logging in...';

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        const data = await API.post('/api/auth/login', { email, password });

        if (data.token) {
          API.setToken(data.token);
          Toast.success(`Welcome back, ${data.name || 'User'}!`);
          
          // Redirect based on role
          setTimeout(() => {
            const role = data.role;
            if (role === 'student') {
              window.location.href = '/student/dashboard.html';
            } else if (role === 'staff') {
              window.location.href = '/staff/dashboard.html';
            } else if (role === 'company') {
              window.location.href = '/company/dashboard.html';
            } else {
              window.location.reload();
            }
          }, 1000);
        } else {
          throw new Error(data.message || 'Login failed');
        }
      } catch (error) {
        Toast.error(error.message || 'Invalid email or password');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Register form handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Creating account...';

        const formData = new FormData(registerForm);
        const payload = Object.fromEntries(formData);
        
        if (!payload.role) {
          throw new Error('Please select a role');
        }
        if ((payload.role === 'student' || payload.role === 'staff') && !payload.collegeCode) {
          throw new Error('College code is required for students and staff');
        }
        if (payload.role === 'company' && !payload.companyName) {
          throw new Error('Company name is required for company registration');
        }

        const data = await API.post('/api/auth/register', payload);

        if (data.userId) {
          Toast.success('Account created successfully! Redirecting to login...');
          registerForm.reset();
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          throw new Error(data.message || 'Registration failed');
        }
      } catch (error) {
        Toast.error(error.message || 'Registration failed. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
