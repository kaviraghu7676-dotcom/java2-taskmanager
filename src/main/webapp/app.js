const state = { tasks: [], filter: 'all', busy: false };
const taskList = document.querySelector('#task-list');
const dialog = document.querySelector('#task-dialog');
const form = document.querySelector('#task-form');

function showToast(message, tone = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tone}`;
    toast.innerHTML = `<span>${tone === 'success' ? '✓' : '!'}</span>${escapeHtml(message)}`;
    document.body.append(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    window.setTimeout(() => {
        toast.classList.remove('visible');
        window.setTimeout(() => toast.remove(), 220);
    }, 2800);
}

async function loadTasks() {
    try {
        const response = await fetch('api/tasks');
        if (!response.ok) throw new Error('Tasks unavailable');
        state.tasks = await response.json();
        render();
    } catch (error) {
        taskList.innerHTML = '<p class="loading">Could not connect to the task service.</p>';
    }
}

function render() {
    const visible = state.tasks.filter((task) => state.filter === 'all' || (state.filter === 'active' && !task.completed) || (state.filter === 'completed' && task.completed));
    taskList.innerHTML = visible.length ? visible.map((task, index) => `
        <article class="task ${task.completed ? 'completed' : ''}">
            <button class="check" data-id="${task.id}" aria-label="Mark ${task.title} complete" style="--delay:${index * 55}ms">${task.completed ? '✓' : ''}</button>
            <div><div class="task-title">${escapeHtml(task.title)}</div></div>
            <div class="task-meta"><span class="tag">${escapeHtml(task.category)}</span><small class="task-date">Today</small></div>
        </article>`).join('') : '<p class="loading">Nothing here yet. A quiet list can be a good list.</p>';
    const completed = state.tasks.filter((task) => task.completed).length;
    const active = state.tasks.length - completed;
    document.querySelector('#all-count').textContent = state.tasks.length;
    document.querySelector('#active-count').textContent = active;
    document.querySelector('#completed-count').textContent = completed;
    document.querySelector('#open-count').textContent = active;
    document.querySelector('#done-count').textContent = completed;
    document.querySelector('#momentum').textContent = `${state.tasks.length ? Math.round(completed / state.tasks.length * 100) : 0}%`;
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item.dataset.filter === state.filter));
    render();
}));

taskList.addEventListener('click', async (event) => {
    const button = event.target.closest('.check');
    if (!button) return;
    const task = state.tasks.find((item) => item.id === Number(button.dataset.id));
    if (!task || state.busy) return;
    const nextValue = !task.completed;
    task.completed = nextValue;
    render();
    state.busy = true;
    try {
        const response = await fetch(`api/tasks?id=${task.id}&completed=${nextValue}`, { method: 'PUT' });
        if (!response.ok) throw new Error('Update failed');
        showToast(nextValue ? 'Task completed. Nice work.' : 'Task moved back to your focus list.');
    } catch (error) {
        task.completed = !nextValue;
        render();
        showToast('Could not update that task.', 'error');
    } finally {
        state.busy = false;
    }
});

document.querySelector('#open-form').addEventListener('click', () => dialog.showModal());
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Creating <span class="button-spinner"></span>';
    const values = new FormData(form);
    try {
        const response = await fetch('api/tasks', { method: 'POST', body: new URLSearchParams(values) });
        if (!response.ok) throw new Error('Create failed');
        showToast('New task added to your focus list.');
    } catch (error) {
        showToast('Could not create the task.', 'error');
        return;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel;
    }
    event.target.reset();
    dialog.close();
    await loadTasks();
});

dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
});

form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dialog.close();
});

fetch('api/health').then((response) => {
    if (!response.ok) throw new Error();
}).catch(() => {
    document.querySelector('#health-label').textContent = 'API needs attention';
    document.querySelector('.status').classList.add('offline');
    showToast('The task service is currently unavailable.', 'error');
});
loadTasks();