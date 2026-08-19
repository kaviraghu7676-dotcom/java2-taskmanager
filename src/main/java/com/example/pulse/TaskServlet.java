package com.example.pulse;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.annotation.WebServlet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@WebServlet(urlPatterns = "/api/tasks")
public class TaskServlet extends HttpServlet {
    private final AtomicLong sequence = new AtomicLong(4);
    private final List<Task> tasks = new ArrayList<>(List.of(
            new Task(1, "Review the quarterly roadmap", "Planning", false),
            new Task(2, "Send design notes to the team", "Communication", true),
            new Task(3, "Prepare Friday's product demo", "Product", false)
    ));

    @Override
    protected synchronized void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(tasksJson());
    }

    @Override
    protected synchronized void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String title = request.getParameter("title");
        String category = request.getParameter("category");
        if (title == null || title.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "A task title is required.");
            return;
        }
        tasks.add(new Task(sequence.getAndIncrement(), title.trim(),
                category == null || category.isBlank() ? "General" : category.trim(), false));
        response.setStatus(HttpServletResponse.SC_CREATED);
        response.setContentType("application/json");
        response.getWriter().write(tasksJson());
    }

    @Override
    protected synchronized void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        long id;
        try {
            id = Long.parseLong(request.getParameter("id"));
        } catch (Exception exception) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "A valid task id is required.");
            return;
        }
        boolean completed = Boolean.parseBoolean(request.getParameter("completed"));
        for (int index = 0; index < tasks.size(); index++) {
            if (tasks.get(index).id() == id) {
                tasks.set(index, tasks.get(index).withCompleted(completed));
                response.setContentType("application/json");
                response.getWriter().write(tasksJson());
                return;
            }
        }
        response.sendError(HttpServletResponse.SC_NOT_FOUND, "Task not found.");
    }

    private String tasksJson() {
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < tasks.size(); index++) {
            Task task = tasks.get(index);
            if (index > 0) json.append(',');
            json.append("{\"id\":").append(task.id())
                    .append(",\"title\":\"").append(escape(task.title()))
                    .append("\",\"category\":\"").append(escape(task.category()))
                    .append("\",\"completed\":").append(task.completed()).append('}');
        }
        return json.append(']').toString();
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}