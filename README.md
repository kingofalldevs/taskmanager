# Study Desk

Study Desk is a single-page student task management dashboard built with plain HTML, CSS, and JavaScript. It has no additional routes, build step, or package dependencies.

## Run locally

Open `index.html` in a modern web browser. The dashboard can also be served from this folder with any static file server.

## Dashboard features

- View a weekly progress summary, upcoming task, study streak, and task list.
- Add tasks with a course, due date, and priority.
- Mark tasks complete or remove them from the list.
- Filter tasks by all, today, upcoming, or completed.
- Search by task title, course, or notes, and sort by due date, priority, or course.
- Use `Command+K` on macOS or `Ctrl+K` elsewhere to focus task search.
- Use the responsive layout on desktop and mobile screens.

Tasks are saved in the browser's local storage on the current device. The included sample tasks appear when there is no saved task list yet; clearing browser storage resets the dashboard to those examples.

The interface uses a black-and-white palette. Google Fonts are loaded over the network; system fallback fonts are used when they are unavailable.