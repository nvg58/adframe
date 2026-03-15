// Config — change this to your deployed domain
const API_BASE = 'http://localhost:3002';
const SUPABASE_URL = 'https://qlxxcnbvmhwerhstjvxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseHhjbmJ2bWh3ZXJoc3RqdnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjQ2NTksImV4cCI6MjA4OTE0MDY1OX0.7OvRIGvfmTOXTJCvnfQd1oW_N5d54H8PVOpNv8wg3t0';

let session = null;
let tags = [];

// Elements
const loginView = document.getElementById('loginView');
const formView = document.getElementById('formView');
const successView = document.getElementById('successView');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const titleInput = document.getElementById('titleInput');
const urlInput = document.getElementById('urlInput');
const contentInput = document.getElementById('contentInput');
const tagInput = document.getElementById('tagInput');
const addTagBtn = document.getElementById('addTagBtn');
const tagsContainer = document.getElementById('tagsContainer');
const submitBtn = document.getElementById('submitBtn');
const clipAnotherBtn = document.getElementById('clipAnotherBtn');
const formError = document.getElementById('formError');
const extractError = document.getElementById('extractError');

// View management
function showView(view) {
  loginView.classList.remove('active');
  formView.classList.remove('active');
  successView.classList.remove('active');
  view.classList.add('active');
}

// Check stored session on load
async function init() {
  const stored = await chrome.storage.local.get('session');
  if (stored.session) {
    session = stored.session;
    showView(formView);
    userEmail.textContent = session.user?.email || '';
    extractContent();
  } else {
    showView(loginView);
  }
}

// SHA256 hash helper
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Google Login — use launchWebAuthFlow to get an ID token
googleLoginBtn.addEventListener('click', async () => {
  try {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const redirectUrl = chrome.identity.getRedirectURL();
    const rawNonce = Math.random().toString(36).substring(2) + Date.now();
    const hashedNonce = await sha256(rawNonce);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', hashedNonce);
    authUrl.searchParams.set('prompt', 'select_account');

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    // Extract id_token from the hash fragment
    const hashParams = new URLSearchParams(responseUrl.split('#')[1]);
    const idToken = hashParams.get('id_token');

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Exchange Google ID token for Supabase session
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        provider: 'google',
        id_token: idToken,
        nonce: rawNonce,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      session = data;
      await chrome.storage.local.set({ session });
      showView(formView);
      userEmail.textContent = data.user?.email || '';
      extractContent();
    } else {
      console.error('Supabase auth error:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Login error:', err);
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  session = null;
  await chrome.storage.local.remove('session');
  showView(loginView);
});

// Extract content from current tab
async function extractContent() {
  extractError.style.display = 'none';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Skip non-http pages (chrome://, about://, etc.)
    if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
      extractError.textContent = 'Cannot extract content from this page.';
      extractError.style.display = 'block';
      return;
    }

    let response;
    try {
      // Try sending message to existing content script
      response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
    } catch (e) {
      // Content script not injected — inject it programmatically
      console.log('Content script not found, injecting...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/Readability.js', 'content.js'],
      });
      // Wait briefly for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      // Retry
      response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
    }

    if (response && response.success) {
      titleInput.value = response.title || '';
      urlInput.value = response.url || '';
      contentInput.value = response.content || '';
    } else {
      extractError.textContent = response?.error || 'Could not extract page content.';
      extractError.style.display = 'block';
      urlInput.value = tab.url || '';
      titleInput.value = tab.title || '';
    }
  } catch (err) {
    console.error('Extract error:', err);
    extractError.textContent = 'Could not connect to the page. Try reloading it.';
    extractError.style.display = 'block';
  }
}

// Tags
function renderTags() {
  tagsContainer.innerHTML = '';
  tags.forEach((tag, i) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${tag} <button data-index="${i}">&times;</button>`;
    tagsContainer.appendChild(el);
  });
  tagsContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      tags.splice(parseInt(btn.dataset.index), 1);
      renderTags();
    });
  });
}

function addTag() {
  const val = tagInput.value.trim();
  if (val && !tags.includes(val)) {
    tags.push(val);
    tagInput.value = '';
    renderTags();
  }
}

addTagBtn.addEventListener('click', addTag);
tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTag();
  }
});

// Submit
submitBtn.addEventListener('click', async () => {
  formError.style.display = 'none';
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    formError.textContent = 'Title and Content are required.';
    formError.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const res = await fetch(`${API_BASE}/api/inbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        content,
        source_url: urlInput.value || null,
        source_author: null,
        tags,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showView(successView);
      // Reset form
      titleInput.value = '';
      urlInput.value = '';
      contentInput.value = '';
      tags = [];
      renderTags();
    } else {
      formError.textContent = data.error || 'Failed to send.';
      formError.style.display = 'block';
    }
  } catch (err) {
    formError.textContent = 'Network error. Check your connection.';
    formError.style.display = 'block';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Send to Inbox';
});

// Clip another
clipAnotherBtn.addEventListener('click', () => {
  showView(formView);
  extractContent();
});

// Init
init();
