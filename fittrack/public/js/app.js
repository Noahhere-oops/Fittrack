(function () {
  "use strict";

  const STORAGE_KEY = "fittrackEntries";
  const OLD_STORAGE_KEY = "entries";
  const LANGUAGE_KEY = "fittrackLanguage";

  const translations = {
    nl: {
      languageButton: "EN",
      landingTitle: "FitTrack",
      landingText: "Houd je gezondheid eenvoudig bij.",
      startBtn: "Verder",
      backBtn: "Terug",
      formTitleNew: "Nieuwe invoer",
      formTitleEdit: "Invoer bewerken",
      overviewTitle: "Overzicht",
      saveBtn: "Opslaan",
      updateBtn: "Bijwerken",
      editBtn: "Bewerken",
      deleteBtn: "Verwijderen",
      emptyMessage: "Nog geen invoer opgeslagen.",
      labels: {
        date: "Datum",
        category: "Categorie",
        description: "Omschrijving",
        value: "Hoeveelheid"
      },
      filters: {
        all: "Alles",
        day: "Dag",
        week: "Week"
      },
      categories: {
        Water: "Water",
        Slaap: "Slaap",
        Workout: "Workout",
        Gewicht: "Gewicht"
      },
      units: {
        L: "L",
        uur: "uur",
        min: "min",
        kg: "kg"
      }
    },
    en: {
      languageButton: "NL",
      landingTitle: "FitTrack",
      landingText: "Keep track of your health easily.",
      startBtn: "Continue",
      backBtn: "Back",
      formTitleNew: "New entry",
      formTitleEdit: "Edit entry",
      overviewTitle: "Overview",
      saveBtn: "Save",
      updateBtn: "Update",
      editBtn: "Edit",
      deleteBtn: "Delete",
      emptyMessage: "No entries saved yet.",
      labels: {
        date: "Date",
        category: "Category",
        description: "Description",
        value: "Amount"
      },
      filters: {
        all: "All",
        day: "Day",
        week: "Week"
      },
      categories: {
        Water: "Water",
        Slaap: "Sleep",
        Workout: "Workout",
        Gewicht: "Weight"
      },
      units: {
        L: "L",
        uur: "hours",
        min: "min",
        kg: "kg"
      }
    }
  };

  let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "nl";
  let entries = loadEntries();
  let currentFilter = "all";

  registerServiceWorker();
  initLanguageButton();
  initDashboard();
  updateLanguage();

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const scriptElement = document.currentScript || document.querySelector('script[src$="app.js"]');
    const scriptUrl = scriptElement
      ? new URL(scriptElement.src, window.location.href)
      : new URL("./public/js/app.js", window.location.href);

    const serviceWorkerUrl = new URL("../../service-worker.js", scriptUrl);
    const serviceWorkerScope = new URL("../../", scriptUrl);

    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register(serviceWorkerUrl.href, { scope: serviceWorkerScope.href })
        .catch(function (error) {
          console.warn("Service worker kon niet worden geregistreerd:", error);
        });
    });
  }

  function initLanguageButton() {
    const languageBtn = document.getElementById("languageBtn");

    if (!languageBtn) {
      return;
    }

    languageBtn.addEventListener("click", function () {
      currentLanguage = currentLanguage === "nl" ? "en" : "nl";
      localStorage.setItem(LANGUAGE_KEY, currentLanguage);
      updateLanguage();
      renderEntries();
    });
  }

  function initDashboard() {
    const form = document.getElementById("healthForm");
    const filterButtons = document.querySelectorAll("button[data-filter]");
    const entriesContainer = document.getElementById("entriesContainer");

    if (!form || !entriesContainer) {
      return;
    }

    form.addEventListener("submit", handleFormSubmit);

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;
        updateActiveFilterButton();
        renderEntries();
      });
    });

    entriesContainer.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-action]");

      if (!button) {
        return;
      }

      const id = Number(button.dataset.id);

      if (button.dataset.action === "delete") {
        deleteEntry(id);
      }

      if (button.dataset.action === "edit") {
        startEditEntry(id);
      }
    });

    renderEntries();
  }

  function loadEntries() {
    const savedEntries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (Array.isArray(savedEntries)) {
      return savedEntries.map(ensureEntryId);
    }

    const oldEntries = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || "null");

    if (Array.isArray(oldEntries)) {
      const migratedEntries = oldEntries.map(ensureEntryId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedEntries));
      localStorage.removeItem(OLD_STORAGE_KEY);
      return migratedEntries;
    }

    return [];
  }

  function ensureEntryId(entry) {
    return {
      id: entry.id || Date.now() + Math.floor(Math.random() * 100000),
      date: entry.date || "",
      category: entry.category || "Water",
      description: entry.description || "",
      value: entry.value || "",
      unit: entry.unit || "L"
    };
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const editIdInput = document.getElementById("editId");
    const editId = editIdInput.value ? Number(editIdInput.value) : null;

    const entry = {
      id: editId || Date.now(),
      date: document.getElementById("date").value,
      category: document.getElementById("category").value,
      description: document.getElementById("description").value.trim(),
      value: document.getElementById("value").value,
      unit: document.getElementById("unit").value
    };

    if (editId) {
      entries = entries.map(function (currentEntry) {
        return currentEntry.id === editId ? entry : currentEntry;
      });
    } else {
      entries.push(entry);
    }

    saveEntries();
    resetForm();
    renderEntries();
  }

  function resetForm() {
    const form = document.getElementById("healthForm");
    const editIdInput = document.getElementById("editId");

    if (!form || !editIdInput) {
      return;
    }

    form.reset();
    editIdInput.value = "";
    updateLanguage();
  }

  function startEditEntry(id) {
    const entry = entries.find(function (currentEntry) {
      return currentEntry.id === id;
    });

    if (!entry) {
      return;
    }

    document.getElementById("editId").value = entry.id;
    document.getElementById("date").value = entry.date;
    document.getElementById("category").value = entry.category;
    document.getElementById("description").value = entry.description;
    document.getElementById("value").value = entry.value;
    document.getElementById("unit").value = entry.unit;

    updateLanguage();
    document.getElementById("healthForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteEntry(id) {
    entries = entries.filter(function (entry) {
      return entry.id !== id;
    });

    saveEntries();
    renderEntries();
  }

  function renderEntries() {
    const entriesContainer = document.getElementById("entriesContainer");

    if (!entriesContainer) {
      return;
    }

    const filteredEntries = getFilteredEntries();
    entriesContainer.innerHTML = "";

    if (filteredEntries.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-message";
      emptyMessage.textContent = translations[currentLanguage].emptyMessage;
      entriesContainer.appendChild(emptyMessage);
      return;
    }

    filteredEntries.forEach(function (entry) {
      entriesContainer.appendChild(createEntryCard(entry));
    });
  }

  function createEntryCard(entry) {
    const card = document.createElement("article");
    card.className = "entry-card";

    const title = document.createElement("h3");
    title.textContent = translations[currentLanguage].categories[entry.category] || entry.category;

    const date = document.createElement("p");
    date.textContent = formatDate(entry.date);

    const description = document.createElement("p");
    description.textContent = entry.description;

    const value = document.createElement("p");
    value.className = "entry-value";
    value.textContent = `${entry.value} ${translations[currentLanguage].units[entry.unit] || entry.unit}`;

    const buttonRow = document.createElement("div");
    buttonRow.className = "button-row";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "editBtn";
    editButton.dataset.action = "edit";
    editButton.dataset.id = entry.id;
    editButton.textContent = translations[currentLanguage].editBtn;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "deleteBtn";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = entry.id;
    deleteButton.textContent = translations[currentLanguage].deleteBtn;

    buttonRow.append(editButton, deleteButton);
    card.append(title, date, description, value, buttonRow);

    return card;
  }

  function getFilteredEntries() {
    const sortedEntries = [...entries].sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    if (currentFilter === "day") {
      return sortedEntries.filter(function (entry) {
        return isToday(entry.date);
      });
    }

    if (currentFilter === "week") {
      return sortedEntries.filter(function (entry) {
        return isThisWeek(entry.date);
      });
    }

    return sortedEntries;
  }

  function isToday(dateString) {
    const today = new Date();
    const date = createLocalDate(dateString);

    return date.toDateString() === today.toDateString();
  }

  function isThisWeek(dateString) {
    const today = new Date();
    const date = createLocalDate(dateString);

    const monday = new Date(today);
    const dayNumber = today.getDay() === 0 ? 6 : today.getDay() - 1;
    monday.setDate(today.getDate() - dayNumber);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return date >= monday && date <= sunday;
  }

  function createLocalDate(dateString) {
    return new Date(`${dateString}T00:00:00`);
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    return createLocalDate(dateString).toLocaleDateString(currentLanguage === "nl" ? "nl-NL" : "en-GB");
  }

  function updateActiveFilterButton() {
    document.querySelectorAll("button[data-filter]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.filter === currentFilter);
    });
  }

  function updateLanguage() {
    const text = translations[currentLanguage];

    setText("languageBtn", text.languageButton);
    setText("landingTitle", text.landingTitle);
    setText("landingText", text.landingText);
    setText("startBtn", text.startBtn);
    setText("backBtn", text.backBtn);
    setText("overviewTitle", text.overviewTitle);
    setText("dateLabel", text.labels.date);
    setText("categoryLabel", text.labels.category);
    setText("descriptionLabel", text.labels.description);
    setText("valueLabel", text.labels.value);
    setText("allBtn", text.filters.all);
    setText("dayBtn", text.filters.day);
    setText("weekBtn", text.filters.week);

    updateFormTexts();
    updateCategoryOptions();
    updateUnitOptions();
    updateActiveFilterButton();
  }

  function updateFormTexts() {
    const editIdInput = document.getElementById("editId");
    const isEditing = Boolean(editIdInput && editIdInput.value);
    const text = translations[currentLanguage];

    setText("formTitle", isEditing ? text.formTitleEdit : text.formTitleNew);
    setText("saveBtn", isEditing ? text.updateBtn : text.saveBtn);
  }

  function updateCategoryOptions() {
    const categorySelect = document.getElementById("category");

    if (!categorySelect) {
      return;
    }

    Array.from(categorySelect.options).forEach(function (option) {
      option.textContent = translations[currentLanguage].categories[option.value] || option.value;
    });
  }

  function updateUnitOptions() {
    const unitSelect = document.getElementById("unit");

    if (!unitSelect) {
      return;
    }

    Array.from(unitSelect.options).forEach(function (option) {
      option.textContent = translations[currentLanguage].units[option.value] || option.value;
    });
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }
})();
