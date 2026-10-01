/* =========================================================
   script.js — Assignment 2: Interactive CV Webpage
   Youssef Ayman Saleh

   Implements:
     1. Welcome message on page load
     2. Dark mode / light mode toggle (persisted)
     3. Show/Hide sections (Skills, Experience, Projects)
     4. Dynamic skills list (add a skill at runtime)
     5. Contact form with validation
     6. Interactive project details (per-project reveal)

   All DOM work runs after the document has parsed, and every
   listener is attached with addEventListener (no inline
   onclick attributes) so markup and behaviour stay separate.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initWelcomeMessage();
  initThemeToggle();
  initCollapsibleSections();
  initDynamicSkills();
  initContactForm();
});

/* ---------------------------------------------------------
   1. Welcome message
   Builds a small dismissible toast and shows it once per
   browser session (so returning to the page immediately
   after closing it doesn't show it again and again).
   --------------------------------------------------------- */
function initWelcomeMessage() {
  var ALREADY_SHOWN_KEY = 'cv-welcome-shown';

  if (sessionStorage.getItem(ALREADY_SHOWN_KEY)) {
    return;
  }

  var toast = document.createElement('div');
  toast.className = 'welcome-toast';
  toast.setAttribute('role', 'status');

  var message = document.createElement('span');
  message.textContent = 'Welcome to my portfolio page! 👋';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'welcome-toast__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Dismiss welcome message');
  closeBtn.textContent = '×';

  toast.appendChild(message);
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);

  // Animate in on the next frame so the CSS transition runs.
  requestAnimationFrame(function () {
    toast.classList.add('is-visible');
  });

  function dismiss() {
    toast.classList.remove('is-visible');
    // Wait for the fade-out transition to finish before removing it.
    setTimeout(function () {
      toast.remove();
    }, 300);
  }

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, 6000); // auto-dismiss after 6 seconds

  sessionStorage.setItem(ALREADY_SHOWN_KEY, 'true');
}

/* ---------------------------------------------------------
   2. Dark mode / light mode toggle
   Preference is saved in localStorage so it persists across
   visits. Defaults to the site's original dark theme.
   --------------------------------------------------------- */
function initThemeToggle() {
  var STORAGE_KEY = 'cv-theme';
  var toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  var icon = toggleBtn.querySelector('.theme-toggle__icon');
  var label = toggleBtn.querySelector('.theme-toggle__label');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      icon.textContent = '☀️';
      label.textContent = 'light';
      toggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      icon.textContent = '🌙';
      label.textContent = 'dark';
      toggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Apply any saved preference on load.
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyTheme(saved);

  toggleBtn.addEventListener('click', function () {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
}

/* ---------------------------------------------------------
   3 & 6. Show/Hide sections + interactive project details
   A single generic handler drives every [data-target] toggle
   button on the page: section-level "hide/show" controls for
   Skills, Experience and Projects, and the per-project
   "view details" buttons. They share the same collapsible
   mechanism but are visually and functionally distinct.
   --------------------------------------------------------- */
function initCollapsibleSections() {
  var toggleButtons = document.querySelectorAll('.toggle-btn[data-target]');

  toggleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var target = document.getElementById(targetId);
      if (!target) return;

      var isExpanded = btn.getAttribute('aria-expanded') === 'true';
      var nowExpanded = !isExpanded;

      target.classList.toggle('is-collapsed', !nowExpanded);
      btn.setAttribute('aria-expanded', String(nowExpanded));

      // Section-level buttons read "hide"/"show"; project-level
      // buttons read "view details"/"hide details". Tell them
      // apart by whether the button also carries the --link style.
      var isProjectDetail = btn.classList.contains('toggle-btn--link');
      var labelText = isProjectDetail
        ? (nowExpanded ? 'hide details' : 'view details')
        : (nowExpanded ? 'hide' : 'show');

      // Replace only the text node after the icon span, so the
      // rotating chevron icon itself is left untouched.
      btn.lastChild.textContent = ' ' + labelText;
    });
  });
}

/* ---------------------------------------------------------
   4. Dynamic skills list
   Lets the visitor add their own skill tag to the page at
   runtime. Each added tag gets a small remove (×) button.
   --------------------------------------------------------- */
function initDynamicSkills() {
  var form = document.getElementById('skill-form');
  var input = document.getElementById('skill-input');
  var list = document.getElementById('custom-skills-list');
  if (!form || !input || !list) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }

    // Avoid adding an exact duplicate (case-insensitive) of a
    // skill that's already in the custom list.
    var alreadyAdded = Array.prototype.some.call(list.children, function (li) {
      return li.dataset.skill && li.dataset.skill.toLowerCase() === value.toLowerCase();
    });
    if (alreadyAdded) {
      input.value = '';
      input.focus();
      return;
    }

    list.appendChild(buildSkillTag(value));
    input.value = '';
    input.focus();
  });

  function buildSkillTag(text) {
    var li = document.createElement('li');
    li.className = 'tag--custom';
    li.dataset.skill = text;

    var label = document.createElement('span');
    label.textContent = text;

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tag__remove';
    removeBtn.setAttribute('aria-label', 'Remove ' + text);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', function () {
      li.remove();
    });

    li.appendChild(label);
    li.appendChild(removeBtn);
    return li;
  }
}

/* ---------------------------------------------------------
   5. Contact form with validation
   Validates required fields and email format client-side,
   shows inline error messages, and on success opens the
   visitor's own email client with the message pre-filled
   (this page has no backend, so this is how it actually
   gets sent, rather than only simulating success).
   --------------------------------------------------------- */
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var nameInput = document.getElementById('cf-name');
  var emailInput = document.getElementById('cf-email');
  var messageInput = document.getElementById('cf-message');
  var status = document.getElementById('form-status');

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form-status';

    var nameOk = validateField(nameInput, nameInput.value.trim().length > 0,
      'Please enter your name.');
    var emailOk = validateField(emailInput, EMAIL_PATTERN.test(emailInput.value.trim()),
      'Please enter a valid email address.');
    var messageOk = validateField(messageInput, messageInput.value.trim().length > 0,
      'Please enter a message.');

    if (!nameOk || !emailOk || !messageOk) {
      status.textContent = 'Please fix the errors above.';
      status.classList.add('is-error');
      return;
    }

    var subject = 'Portfolio contact from ' + nameInput.value.trim();
    var body = messageInput.value.trim() + '\n\n— ' + nameInput.value.trim() +
      ' (' + emailInput.value.trim() + ')';
    var mailtoUrl = 'mailto:youssefaymansaleh@outlook.com' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    status.textContent = 'Looks good — opening your email client to send it...';
    status.classList.add('is-success');

    window.location.href = mailtoUrl;
    form.reset();
  });

  function validateField(input, isValid, message) {
    var row = input.closest('.form-row');
    var errorEl = document.getElementById(input.id + '-error');

    if (isValid) {
      row.classList.remove('has-error');
      errorEl.textContent = '';
    } else {
      row.classList.add('has-error');
      errorEl.textContent = message;
    }
    return isValid;
  }
}
