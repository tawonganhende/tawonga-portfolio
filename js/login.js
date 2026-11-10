import { supabase } from './supabase-client.js';
import { isSupabaseConfigured } from './supabase-config.js';

const form = document.getElementById('login-form');
const status = document.getElementById('login-status');
const configAlert = document.getElementById('dashboard-config-alert');
const forgotPassword = document.getElementById('forgot-password');

function showConfigError() {
  configAlert.textContent = 'Supabase is not configured. Please check js/supabase-config.js';
  configAlert.hidden = false;
}

async function handleLogin(event) {
  event.preventDefault();
  
  if (!isSupabaseConfigured()) {
    showConfigError();
    return;
  }

  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');

  status.textContent = 'Authenticating...';
  status.style.color = '#333';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    status.textContent = 'Success! Redirecting...';
    status.style.color = 'green';
    
    setTimeout(() => {
      window.location.assign('dashboard.html');
    }, 800);

  } catch (error) {
    status.textContent = error.message || 'Login failed. Please check your credentials.';
    status.style.color = 'red';
  }
}

async function handleForgotPassword() {
  if (!isSupabaseConfigured()) {
    showConfigError();
    return;
  }

  const emailInput = form.elements.email;
  if (!emailInput.reportValidity()) {
    return;
  }

  status.textContent = 'Sending password reset email...';
  status.style.color = '#333';

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value, {
      redirectTo: new URL('reset-password.html', window.location.href).href,
    });

    if (error) throw error;

    status.textContent = 'If an account exists for that email, a password reset link has been sent.';
    status.style.color = 'green';
  } catch (error) {
    status.textContent = error.message || 'Unable to send a password reset email.';
    status.style.color = 'red';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  form.addEventListener('submit', handleLogin);
  forgotPassword.addEventListener('click', handleForgotPassword);

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      status.textContent = error.message;
      status.style.color = 'red';
      return;
    }

    if (data.session) {
      window.location.assign('dashboard.html');
    }
  }
});