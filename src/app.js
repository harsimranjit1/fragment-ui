// src/app.js

import { signIn, getUser } from './auth';
import { getUserFragments } from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');

  // On login button click, redirect to Cognito login
  loginBtn.onclick = () => {
    signIn();
  };

  // Check if user is authenticated
  const user = await getUser();
  if (!user) return;

  // Show user info on page
  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  // Do an authenticated request to the fragments API server and log the result
  const userFragments = await getUserFragments(user);

  // Future: show user fragments in HTML
  console.log('Fetched fragments for user:', userFragments);
}

// Initialize when DOM loads
addEventListener('DOMContentLoaded', init);
