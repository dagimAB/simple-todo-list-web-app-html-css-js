# Todo List Web App

A simple, lightweight Todo List built with HTML, CSS and JavaScript. Create, edit, complete, and remove tasks. Data persists locally in the browser (localStorage).

## Features
- Add new tasks
- Mark tasks as completed / active
- Edit and delete tasks
- Persistent storage using localStorage
- Responsive, minimal UI

## Demo
Open `https://dagim-abraham-todo-list.netlify.app/` in your browser (no build step required). For live reload use a static server or VS Code Live Server.

## Getting started
1. Clone or copy project files into your project folder:
    - index.html
    - css/styles.css
    - js/app.js
    - README.md
2. Open `index.html` in a browser.

## Usage
- Type a task and press Enter or click Add.
- Click a task checkbox to toggle complete.
- Click edit to modify a task, save or cancel.
- Click delete to remove a task.
- Tasks are saved automatically in localStorage.

## Recommended file structure
- index.html
- css/
  - styles.css
- js/
  - app.js
- assets/
  - icons
- README.md

## Implementation notes
- Keep JavaScript modular: separate DOM helpers, storage, and UI logic.
- Use event delegation for dynamic task items.
- Throttle UI updates to keep interactions snappy.
- Optional: add drag-and-drop reordering or categories.

## Customization
- Replace styles in `css/styles.css` to change theme.
- Add filters (All / Active / Completed) in `js/app.js`.
- Add export/import of tasks using JSON.

## Contributing
Open issues or submit pull requests. Keep changes focused and include tests or manual verification steps.

## License
MIT — use and modify freely.
