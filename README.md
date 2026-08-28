# Pulse Dashboard

A Maven-managed Jakarta Servlet web application packaged as a WAR. It includes a responsive task dashboard, an in-memory task API, and a health endpoint.

## Requirements

- JDK 17 or newer
- Maven 3.9 or newer
- A Jakarta EE 10 compatible servlet container, such as Tomcat 10.1+

## Build

From the project directory:

```text
mvn clean package
```

The deployable artifact is created at `target/pulse-dashboard.war`. Copy it to the container's deployment directory, then open `/pulse-dashboard/` in a browser.

## API

- `GET /api/health` returns service status.
- `GET /api/tasks` returns the current in-memory task list.
- `POST /api/tasks` accepts form fields `title` and `category`.
- `PUT /api/tasks?id=1&completed=true` updates completion state.

Task data resets whenever the application restarts. Replace the list in `TaskServlet` with a repository or database integration for  .
