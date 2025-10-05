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

  // References for list management UI
  const listManagementDiv = document.getElementById('list-management');
  const recurringListEl = document.getElementById('recurring-list');
  const extraListEl = document.getElementById('extra-list');
  const recurringInput = document.getElementById('recurring-item');
  const extraInput = document.getElementById('extra-item');
  const addRecurringBtn = document.getElementById('add-recurring');
  const addExtraBtn = document.getElementById('add-extra');

  // Initialize Firestore service
  const db = firebase.firestore ? firebase.firestore() : null;

  // Keep track of the current authenticated user and Firestore listener
  let currentUser = null;
  let unsubscribeLists = null;

  /**
   * Render a list of items into a given UL element.
   * Clears existing children before rendering.
   * @param {HTMLElement} listElement - The UL element to populate.
   * @param {Array<string>} items - Array of item strings.
   */
  function renderList(listElement, items) {
    if (!listElement) return;
    listElement.innerHTML = '';
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        listElement.appendChild(li);
      });
    }
  }

  /**
   * Subscribe to changes in the user's lists document and update the UI in real-time.
   * Returns a function to unsubscribe from the listener.
   * @param {firebase.User} user - The currently authenticated user.
   */
  function subscribeToLists(user) {
    if (!db || !user) return null;
    const docRef = db.collection('users').doc(user.uid);
    return docRef.onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : {};
      renderList(recurringListEl, data.recurring || []);
      renderList(extraListEl, data.extra || []);
    });
  }

  /**
   * Add an item to the user's recurring or extra list in Firestore.
   * Uses arrayUnion to avoid duplicates.
   * @param {string} type - Either 'recurring' or 'extra'.
   * @param {string} item - The item text to add.
   */
  function addItem(type, item) {
    if (!db || !currentUser || !item) return;
    const docRef = db.collection('users').doc(currentUser.uid);
    const updateData = {};
    updateData[type] = firebase.firestore.FieldValue.arrayUnion(item);
    docRef.set(updateData, { merge: true })
      .catch((error) => {
        console.error(`Error adding ${type} item:`, error);
        alert(error.message);
      });
  }

  // Attach list management event listeners
  if (addRecurringBtn) {
    addRecurringBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const value = recurringInput ? recurringInput.value.trim() : '';
      if (value) {
        addItem('recurring', value);
        recurringInput.value = '';
      }
    });
  }
  if (addExtraBtn) {
    addExtraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const value = extraInput ? extraInput.value.trim() : '';
      if (value) {
        addItem('extra', value);
        extraInput.value = '';
      }
    });
  }

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
      currentUser = user;
      if (userInfoDiv) {
        userInfoDiv.textContent = 'Logged in as ' + (user.email || '');
        userInfoDiv.style.display = 'block';
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (registerForm) registerForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'none';
      if (showRegisterBtn) showRegisterBtn.style.display = 'none';
      if (showLoginBtn) showLoginBtn.style.display = 'none';
      // Show list management UI
      if (listManagementDiv) listManagementDiv.style.display = 'block';
      // Subscribe to list updates
      if (unsubscribeLists) unsubscribeLists();
      unsubscribeLists = subscribeToLists(user);
    } else {
      // User is signed out, show registration and login buttons
      currentUser = null;
      if (userInfoDiv) userInfoDiv.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (showRegisterBtn) showRegisterBtn.style.display = 'inline-block';
      if (showLoginBtn) showLoginBtn.style.display = 'inline-block';
      // Hide forms by default; user can choose which one to show
      if (registerForm) registerForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'none';
      // Hide list management UI and clear lists
      if (listManagementDiv) listManagementDiv.style.display = 'none';
      renderList(recurringListEl, []);
      renderList(extraListEl, []);
      if (unsubscribeLists) {
        unsubscribeLists();
        unsubscribeLists = null;
      }
    }
  });
} else {
  console.warn('Firebase is not defined. Authentication will not work.');
}
