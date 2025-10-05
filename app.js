// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Firebase Authentication and UI logic

// Check if Firebase has been loaded
if (typeof firebase !== 'undefined') {
  // Initialize Firebase Auth instance
  const auth = firebase.auth();

  // Grab references to DOM elements used for authentication
  // Note: element IDs in index.html use hyphenated naming (e.g. register-form, register-btn).
  // Grab DOM elements using the same IDs defined in index.html
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const registerBtn = document.getElementById('register-btn');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const userInfoDiv = document.getElementById('user-info');

  /**
   * Toggle visibility of the registration form and hide the login form.
   */
  function showRegisterForm() {
    if (registerForm) registerForm.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
  }

  /**
   * Toggle visibility of the login form and hide the registration form.
   */
  function showLoginForm() {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
  }

  // Attach event listeners only if the corresponding elements exist
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showRegisterForm();
    });
  }
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  // Register new users with email and password
  if (registerBtn) {
    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('reg-email');
      const passwordInput = document.getElementById('reg-password');
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log('User registered:', userCredential.user);
          // Clear form fields after successful registration
          if (emailInput) emailInput.value = '';
          if (passwordInput) passwordInput.value = '';
        })
        .catch((error) => {
          console.error('Registration error:', error.message);
          alert(error.message);
        });
    });
  }

  // Log existing users in with email and password
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log('User logged in:', userCredential.user);
          // Clear form fields after successful login
          if (emailInput) emailInput.value = '';
          if (passwordInput) passwordInput.value = '';
        })
        .catch((error) => {
          console.error('Login error:', error.message);
          alert(error.message);
        });
    });
  }

  // Log users out
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      auth.signOut()
        .then(() => {
          console.log('User signed out');
        })
        .catch((error) => {
          console.error('Logout error:', error.message);
          alert(error.message);
        });
    });
  }

  // Listen for authentication state changes and update the UI accordingly
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, update UI to reflect logged in state
      if (userInfoDiv) {
        userInfoDiv.textContent = 'Logged in as ' + (user.email || '');
        userInfoDiv.style.display = 'block';
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (registerForm) registerForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'none';
      if (showRegisterBtn) showRegisterBtn.style.display = 'none';
      if (showLoginBtn) showLoginBtn.style.display = 'none';
    } else {
      // User is signed out, show registration and login buttons
      if (userInfoDiv) userInfoDiv.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (showRegisterBtn) showRegisterBtn.style.display = 'inline-block';
      if (showLoginBtn) showLoginBtn.style.display = 'inline-block';
      // Hide forms by default; user can choose which one to show
      if (registerForm) registerForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'none';
    }
  });
} else {
  console.warn('Firebase is not defined. Authentication will not work.');
}
