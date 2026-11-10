import { supabase } from './supabase-client.js';
import { isSupabaseConfigured } from './supabase-config.js';

const form = document.getElementById('reset-password-form');
const status = document.getElementById('reset-password-status');
const configAlert = document.getElementById('dashboard-config-alert');

function setStatus(message, color = '#333') {
  status.textContent = message;
  status.style.color = color;
}

function setConfigError(message) {
  configAlert.textContent = message;
  configAlert.hidden = false;
}

async function handlePasswordReset(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm-password');

  if (password !== confirmPassword) {
    setStatus('The passwords do not match.', 'red');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus('Updating your password...');

  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    form.hidden = true;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setStatus(`Your password was updated, but signing out failed: ${signOutError.message}`, 'red');
      return;
    }

    setStatus('Your password has been updated. Return to the login page to sign in.', 'green');
  } catch (error) {
    setStatus(error.message || 'Unable to update your password.', 'red');
    submitButton.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!isSupabaseConfigured()) {
    setConfigError('Supabase is not configured. Please check js/supabase-config.js');
    return;
  }

  const recoveryError = new URLSearchParams(window.location.hash.slice(1)).get('error_description');
  if (recoveryError) {
    setStatus(`${recoveryError} Request a new password reset email from the login page.`, 'red');
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setStatus(error.message, 'red');
    return;
  }

  if (!data.session) {
    setStatus('This password reset link is invalid or expired. Request a new one from the login page.', 'red');
    return;
  }

  form.hidden = false;
  form.addEventListener('submit', handlePasswordReset);
});
