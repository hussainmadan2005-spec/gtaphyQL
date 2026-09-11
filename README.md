# GraphQL Profile Dashboard

A simple dashboard for viewing student progress from the Reboot01 API.

It logs in with a username/password, gets a JWT token, and then displays personal stats using GraphQL queries and custom SVG charts.

## Features

- Sign in with Reboot01 credentials
- View total XP and project progress
- See audit ratio (done vs received)
- Check project pass/fail statistics
- Explore skill rankings and XP per project
- Visualize XP growth over time through SVG charts

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- GraphQL API
- JWT authentication

## Run locally

1. Open the project folder in a browser or serve it locally.
2. Start a local server, for example:

   python -m http.server 1234

3. Open:

   http://localhost:1234

4. Sign in with your Reboot01 account.

## Project files

- app.js — main logic and GraphQL requests
- svg.js — chart rendering
- utils.js — helper functions
- index.html — dashboard layout
- style.css — styling

## Notes

- The app stores the JWT in localStorage for the current browser session.
- It expects the Reboot01 GraphQL endpoints to be available.
- This is a frontend-only project and does not include a backend server.
