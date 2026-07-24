const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
const tabPanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const tabList = document.querySelector('[role="tablist"]');
const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const storageKeys = {
  activeTab: "tabfusion-active-tab",
  theme: "tabfusion-theme",
};

let activeIndex = 0;
let touchStartX = 0;

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggles.forEach((toggle) => {
    const isDark = theme === "dark";
    const icon = toggle.querySelector(".theme-icon");
    const label = toggle.querySelector(".theme-label");

    if (icon) {
      icon.textContent = isDark ? "☀️" : "🌙";
    }

    if (label) {
      label.textContent = isDark ? "Light Mode" : "Dark Mode";
    }

    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  });
  localStorage.setItem(storageKeys.theme, theme);
}

function getTabIndexById(tabId) {
  return tabButtons.findIndex((button) => button.id === tabId);
}

function updateActiveTab(index, options = {}) {
  const { persist = true, animate = true, scrollIntoView = true } = options;
  const nextIndex = Math.max(0, Math.min(index, tabButtons.length - 1));

  if (
    nextIndex === activeIndex &&
    tabButtons[nextIndex]?.classList.contains("active")
  ) {
    return;
  }

  activeIndex = nextIndex;
  const selectedButton = tabButtons[nextIndex];
  const selectedPanel = tabPanels[nextIndex];

  tabButtons.forEach((button, idx) => {
    const isActive = idx === nextIndex;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  tabPanels.forEach((panel) => {
    panel.classList.remove("active");
    panel.hidden = true;
  });

  if (animate) {
    selectedPanel.classList.add("is-loading");
    selectedPanel.hidden = false;
    window.setTimeout(() => {
      selectedPanel.classList.remove("is-loading");
      selectedPanel.classList.add("active");
    }, 260);
  } else {
    selectedPanel.hidden = false;
    selectedPanel.classList.add("active");
  }

  if (scrollIntoView) {
    selectedPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (persist) {
    localStorage.setItem(storageKeys.activeTab, selectedButton.dataset.tab);
  }
}

function restoreState() {
  const savedTab = localStorage.getItem(storageKeys.activeTab);
  const savedTheme = localStorage.getItem(storageKeys.theme);

  if (savedTheme === "dark" || savedTheme === "light") {
    setTheme(savedTheme);
  } else {
    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }

  const initialIndex = savedTab ? getTabIndexById(`tab-${savedTab}`) : 0;
  updateActiveTab(initialIndex >= 0 ? initialIndex : 0, {
    persist: false,
    animate: false,
  });
}

function handleKeyboardNavigation(event) {
  const currentIndex = tabButtons.findIndex(
    (button) => button === document.activeElement,
  );

  if (currentIndex < 0) {
    return;
  }

  let nextIndex = currentIndex;

  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      nextIndex = (currentIndex + 1) % tabButtons.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = tabButtons.length - 1;
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      updateActiveTab(currentIndex, {
        persist: true,
        animate: true,
        scrollIntoView: true,
      });
      return;
    default:
      return;
  }

  event.preventDefault();
  const nextButton = tabButtons[nextIndex];
  nextButton.focus();
  updateActiveTab(nextIndex, {
    persist: true,
    animate: true,
    scrollIntoView: false,
  });
}

function validateContactForm(event) {
  event.preventDefault();

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const message = document.getElementById("message");
  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const messageError = document.getElementById("messageError");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let isValid = true;

  [
    [name, nameError, "Please enter your name."],
    [email, emailError, "Please enter a valid email."],
    [message, messageError, "Please share a short message."],
  ].forEach(([field, errorNode, fallbackMessage]) => {
    field.classList.remove("invalid");
    errorNode.textContent = "";

    if (!field.value.trim()) {
      field.classList.add("invalid");
      errorNode.textContent = fallbackMessage;
      isValid = false;
      return;
    }

    if (field === email && !emailPattern.test(email.value.trim())) {
      field.classList.add("invalid");
      errorNode.textContent = fallbackMessage;
      isValid = false;
    }
  });

  if (!isValid) {
    formStatus.textContent = "Please correct the highlighted fields.";
    formStatus.className = "form-status error";
    return;
  }

  formStatus.textContent =
    "Message sent successfully. We will be in touch shortly.";
  formStatus.className = "form-status success";
  contactForm.reset();
}

function bindEvents() {
  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () =>
      updateActiveTab(index, {
        persist: true,
        animate: true,
        scrollIntoView: true,
      }),
    );
  });

  tabList.addEventListener("keydown", handleKeyboardNavigation);

  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const nextTheme =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      setTheme(nextTheme);
    });
  });

  contactForm.addEventListener("submit", validateContactForm);

  const panelsContainer = document.querySelector(".tab-panels");
  panelsContainer.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
  });

  panelsContainer.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) < 70) {
      return;
    }

    if (deltaX < 0) {
      updateActiveTab((activeIndex + 1) % tabButtons.length, {
        persist: true,
        animate: true,
        scrollIntoView: true,
      });
    } else {
      updateActiveTab(
        (activeIndex - 1 + tabButtons.length) % tabButtons.length,
        { persist: true, animate: true, scrollIntoView: true },
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  restoreState();
});
