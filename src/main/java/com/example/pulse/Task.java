package com.example.pulse;

public record Task(long id, String title, String category, boolean completed) {
    public Task withCompleted(boolean value) {
        return new Task(id, title, category, value);
    }
}