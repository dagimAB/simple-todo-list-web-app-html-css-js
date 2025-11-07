class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    this.currentFilter = "all";
    this.currentCategory = "all";
    this.searchQuery = "";
    this.draggedItem = null;
    this.init();
  }

  init() {
    this.loadTheme();
    this.bindEvents();
    this.render();
    this.updateStats();
  }

  bindEvents() {
    // Add task event
    document
      .getElementById("addTaskBtn")
      .addEventListener("click", () => this.addTask());
    document.getElementById("taskInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask();
    });

    // Filter events
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.setFilter(e.target.dataset.filter)
      );
    });

    // Category filter events
    document.querySelectorAll(".category-filter").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.setCategoryFilter(e.target.dataset.category)
      );
    });

    // Search event with debouncing
    document.getElementById("searchInput").addEventListener(
      "input",
      Utils.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      }, 300)
    );

    // Clear completed event
    document
      .getElementById("clearCompleted")
      .addEventListener("click", () => this.clearCompleted());

    // Export/Import events
    document
      .getElementById("exportBtn")
      .addEventListener("click", () => this.exportTasks());
    document
      .getElementById("importBtn")
      .addEventListener("click", () => this.triggerImport());
    document
      .getElementById("importFile")
      .addEventListener("change", (e) => this.importTasks(e));

    // Theme toggle
    document
      .getElementById("themeToggle")
      .addEventListener("click", () => this.toggleTheme());
  }

  addTask() {
    const input = document.getElementById("taskInput");
    const dueDateInput = document.getElementById("dueDateInput");
    const categoryInput = document.getElementById("categoryInput");

    const text = input.value.trim();
    const dueDate = dueDateInput.value;
    const category = categoryInput.value;

    if (text) {
      const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate || null,
        category: category || null,
        position: this.tasks.length,
      };

      this.tasks.unshift(task);
      input.value = "";
      dueDateInput.value = "";
      categoryInput.value = "";
      this.save();
      this.render();
      this.updateStats();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.save();
    this.render();
    this.updateStats();
  }

  toggleTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      this.render();
      this.updateStats();
    }
  }

  editTask(id, newText, newDueDate = null, newCategory = null) {
    const task = this.tasks.find((task) => task.id === id);
    if (task && newText.trim()) {
      task.text = newText.trim();
      if (newDueDate !== null) task.dueDate = newDueDate;
      if (newCategory !== null) task.category = newCategory;
      this.save();
      this.render();
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });

    this.render();
  }

  setCategoryFilter(category) {
    this.currentCategory = category;

    document.querySelectorAll(".category-filter").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    this.render();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter((task) => !task.completed);
    this.save();
    this.render();
    this.updateStats();
  }

  getFilteredTasks() {
    let filteredTasks = this.tasks;

    // Apply search filter
    if (this.searchQuery) {
      filteredTasks = filteredTasks.filter((task) =>
        task.text.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply status filter
    switch (this.currentFilter) {
      case "active":
        filteredTasks = filteredTasks.filter((task) => !task.completed);
        break;
      case "completed":
        filteredTasks = filteredTasks.filter((task) => task.completed);
        break;
      case "overdue":
        filteredTasks = filteredTasks.filter(
          (task) =>
            !task.completed && task.dueDate && Utils.isOverdue(task.dueDate)
        );
        break;
    }

    // Apply category filter
    if (this.currentCategory !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === this.currentCategory
      );
    }

    return filteredTasks.sort((a, b) => a.position - b.position);
  }

  render() {
    const taskList = document.getElementById("taskList");
    const emptyState = document.getElementById("emptyState");
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      taskList.classList.add("hidden");
      emptyState.classList.remove("hidden");
    } else {
      taskList.classList.remove("hidden");
      emptyState.classList.add("hidden");

      taskList.innerHTML = filteredTasks
        .map((task) => {
          const isOverdue =
            task.dueDate && Utils.isOverdue(task.dueDate) && !task.completed;
          const dueDateClass = isOverdue ? "overdue" : "";

          return `
                <li class="task-item ${task.completed ? "completed" : ""} ${
            isOverdue ? "overdue" : ""
          }" 
                    data-id="${task.id}" draggable="true">
                    <input type="checkbox" class="task-checkbox" ${
                      task.completed ? "checked" : ""
                    }>
                    <div class="task-content">
                        <span class="task-text">${this.escapeHtml(
                          task.text
                        )}</span>
                        <div class="task-meta">
                            ${
                              task.dueDate
                                ? `
                                <span class="task-due-date ${dueDateClass}">
                                    <i class="fas fa-calendar"></i>
                                    ${Utils.formatDate(task.dueDate)}
                                    ${isOverdue ? " (Overdue!)" : ""}
                                </span>
                            `
                                : ""
                            }
                            ${
                              task.category
                                ? `
                                <span class="task-category">${task.category}</span>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="drag-handle" title="Drag to reorder" style="cursor: move;">
                            <i class="fas fa-grip-vertical"></i>
                        </button>
                    </div>
                </li>
                `;
        })
        .join("");

      this.attachTaskEventListeners();
      this.initDragAndDrop();
    }
  }

  attachTaskEventListeners() {
    const taskList = document.getElementById("taskList");

    // Checkbox events
    taskList.querySelectorAll(".task-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const taskId = parseInt(checkbox.closest(".task-item").dataset.id);
        this.toggleTask(taskId);
      });
    });

    // Delete button events
    taskList.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const taskId = parseInt(btn.closest(".task-item").dataset.id);
        this.deleteTask(taskId);
      });
    });

    // Edit button events
    taskList.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const taskItem = btn.closest(".task-item");
        const taskId = parseInt(taskItem.dataset.id);
        const task = this.tasks.find((t) => t.id === taskId);

        if (task) {
          this.showEditModal(task);
        }
      });
    });
  }

  showEditModal(task) {
    const newText = prompt("Edit task text:", task.text);
    if (newText === null) return;

    let newDueDate = task.dueDate;
    let newCategory = task.category;

    // Ask for due date
    const dueDateInput = prompt(
      "Edit due date (YYYY-MM-DD) or leave empty:",
      task.dueDate || ""
    );
    if (dueDateInput !== null) {
      newDueDate = dueDateInput || null;
    }

    // Ask for category
    const categoryInput = prompt(
      "Edit category (work, personal, shopping, health, other) or leave empty:",
      task.category || ""
    );
    if (categoryInput !== null) {
      newCategory = categoryInput || null;
    }

    this.editTask(task.id, newText, newDueDate, newCategory);
  }

  initDragAndDrop() {
    const taskList = document.getElementById("taskList");
    const items = taskList.querySelectorAll(".task-item");

    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        this.draggedItem = item;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        this.draggedItem = null;
      });
    });

    taskList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(taskList, e.clientY);
      const draggable = this.draggedItem;

      if (afterElement == null) {
        taskList.appendChild(draggable);
      } else {
        taskList.insertBefore(draggable, afterElement);
      }
    });

    taskList.addEventListener("drop", (e) => {
      e.preventDefault();
      this.updateTaskPositions();
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".task-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  updateTaskPositions() {
    const taskList = document.getElementById("taskList");
    const items = taskList.querySelectorAll(".task-item");

    items.forEach((item, index) => {
      const taskId = parseInt(item.dataset.id);
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        task.position = index;
      }
    });

    this.save();
  }

  updateStats() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter((task) => task.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const overdueTasks = this.tasks.filter(
      (task) => !task.completed && task.dueDate && Utils.isOverdue(task.dueDate)
    ).length;

    let countText = "";
    if (this.currentFilter === "all") {
      countText = `${totalTasks} task${totalTasks !== 1 ? "s" : ""} total`;
    } else if (this.currentFilter === "active") {
      countText = `${activeTasks} active task${activeTasks !== 1 ? "s" : ""}`;
    } else if (this.currentFilter === "completed") {
      countText = `${completedTasks} completed task${
        completedTasks !== 1 ? "s" : ""
      }`;
    } else if (this.currentFilter === "overdue") {
      countText = `${overdueTasks} overdue task${
        overdueTasks !== 1 ? "s" : ""
      }`;
    }

    document.getElementById("taskCount").textContent = countText;
  }

  // Theme Management
  loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    this.updateThemeIcon(newTheme);
  }

  updateThemeIcon(theme) {
    const icon = document.querySelector("#themeToggle i");
    icon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
  }

  // Export/Import functionality
  exportTasks() {
    const data = {
      tasks: this.tasks,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    Utils.downloadFile(
      JSON.stringify(data, null, 2),
      `todo-export-${new Date().toISOString().split("T")[0]}.json`,
      "application/json"
    );
  }

  triggerImport() {
    document.getElementById("importFile").click();
  }

  async importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await Utils.readFile(file);
      const data = JSON.parse(content);

      if (data.tasks && Array.isArray(data.tasks)) {
        if (
          confirm(
            `Import ${data.tasks.length} tasks? This will replace your current tasks.`
          )
        ) {
          this.tasks = data.tasks;
          this.save();
          this.render();
          this.updateStats();
          alert("Tasks imported successfully!");
        }
      } else {
        alert("Invalid file format");
      }
    } catch (error) {
      alert("Error importing tasks: " + error.message);
    }

    // Reset file input
    event.target.value = "";
  }

  save() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
