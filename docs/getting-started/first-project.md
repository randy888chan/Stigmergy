# Your First BMad Project

Build a complete project using BMad Method to experience the full workflow from concept to deployment.

!!! tip "Before You Start"
    Ensure you've completed [installation](installation.md) and [verification](verification.md) before proceeding.

## Project Overview

We'll build a **Simple Task Manager** web application that demonstrates:

- 📋 **Complete BMad workflow** from requirements to deployment
- 🎭 **Persona switching** for different development phases
- ⚡ **Quality gates** and validation in practice
- 🧠 **Memory system** for learning and improvement
- 🤝 **Brotherhood review** process

**Expected time:** 45-60 minutes

---

## Step 1: Project Initialization

Let's start by setting up a new project using BMad Method:

### 1.1 Create Project Directory

```bash
# Create a new project directory
mkdir task-manager-app
cd task-manager-app

# Initialize the project with BMad Method
# (This copies the BMad system into your project)
cp -r /path/to/bmad-method/bmad-agent .
cp /path/to/bmad-method/verify-setup.sh .

# Initialize git repository
git init
git add .
git commit -m "Initial project setup with BMad Method"
```

### 1.2 Activate BMad Orchestrator

Start your BMad session and activate the first persona:

```bash
# Start BMad in your project directory
# This would typically be done in your IDE/Cursor
# For this tutorial, we'll simulate the process
```

**In your IDE (Cursor/VS Code):**
1. Open the project directory
2. Activate BMad Method (specific to your IDE integration)
3. You should see the BMad orchestrator ready

---

## Step 2: Requirements Analysis (Product Manager Persona)

Let's start by understanding what we need to build:

### 2.1 Activate Product Manager Persona

In BMad Orchestrator:
```
/pm
```

This activates the Product Manager persona (Jack), who will help us define requirements.

### 2.2 Create Product Requirements

**Task: Create PRD (Product Requirements Document)**

As the PM persona, let's define our task manager requirements:

```markdown
# Task Manager App - Product Requirements

## Problem Statement
Individual users need a simple, effective way to organize and track their daily tasks without the complexity of enterprise project management tools.

## Target User
- Individual professionals and students
- 25-45 years old
- Basic tech comfort level
- Need simple task organization

## Core Features (MVP)
1. **Task Creation** - Add tasks with title and description
2. **Task Management** - Mark complete, edit, delete
3. **Simple Organization** - Basic categories/labels
4. **Local Storage** - No account required initially

## Success Metrics
- User can create and complete first task within 2 minutes
- 80% task completion rate for created tasks
- Under 5 seconds for core operations
```

### 2.3 Quality Gate: PM Checklist

Run the PM checklist to validate requirements:

```
/checklist pm-checklist
```

**Key validations:**
- [ ] Clear problem statement
- [ ] Defined target user  
- [ ] Specific success metrics
- [ ] Feasible scope for MVP

---

## Step 3: Architecture Design (Architect Persona)

Switch to technical architecture planning:

### 3.1 Activate Architect Persona

```
/architect
```

This activates the Architect persona (Mo) for technical design.

### 3.2 Create Architecture

**Task: Define Technical Architecture**

As the Architect, let's design our technical approach:

```markdown
# Task Manager - Technical Architecture

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: localStorage (browser-based)
- **Styling**: CSS Grid/Flexbox
- **Build**: Simple static files (no build process)

## Architecture Patterns
- **MVC Pattern**: Separate concerns clearly
- **Progressive Enhancement**: Works without JavaScript
- **Responsive Design**: Mobile-first approach

## File Structure
```
task-manager-app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── task.js
│   └── storage.js
└── README.md
```

## Key Decisions
1. **No Framework**: Keep it simple for learning
2. **Local Storage**: No backend complexity
3. **Progressive Enhancement**: Accessibility first
```

### 3.3 Quality Gate: Architecture Review

Run Ultra-Deep Thinking Mode (UDTM) on the architecture:

```
/udtm
```

**UDTM Analysis:**
- ✅ Simplicity aligns with user needs
- ✅ No over-engineering for MVP scope
- ✅ Progressive enhancement ensures accessibility
- ⚠️ Consider: Future scalability if user growth occurs
- ✅ Technology choices match team skills

---

## Step 4: Development (Developer Persona)

Time to build the application:

### 4.1 Activate Developer Persona

```
/dev
```

This activates the Developer persona for implementation.

### 4.2 Build Core Components

**Task: Implement MVP Features**

#### Create HTML Structure (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>My Task Manager</h1>
            <p>Stay organized, get things done</p>
        </header>
        
        <main>
            <form id="task-form" class="task-form">
                <input type="text" id="task-input" placeholder="What needs to be done?" required>
                <button type="submit">Add Task</button>
            </form>
            
            <div class="task-list-container">
                <ul id="task-list" class="task-list"></ul>
            </div>
        </main>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/task.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

#### Create CSS Styling (css/styles.css)

```css
/* Task Manager Styles */
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #059669;
    --danger-color: #dc2626;
    --background: #f8fafc;
    --surface: #ffffff;
    --text: #1e293b;
    --text-muted: #64748b;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.6;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

header h1 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

header p {
    color: var(--text-muted);
}

.task-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

#task-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
}

#task-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

button {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
}

button:hover {
    background: #1d4ed8;
}

.task-list {
    list-style: none;
}

.task-item {
    background: var(--surface);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-item.completed {
    opacity: 0.6;
}

.task-item.completed .task-text {
    text-decoration: line-through;
}

.task-checkbox {
    width: 1.25rem;
    height: 1.25rem;
}

.task-text {
    flex: 1;
}

.task-delete {
    background: var(--danger-color);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

.task-delete:hover {
    background: #b91c1c;
}
```

#### Create JavaScript Components

**Storage Module (js/storage.js)**

```javascript
// Local Storage Management
const TaskStorage = {
    STORAGE_KEY: 'taskManager_tasks',
    
    getTasks: function() {
        const tasks = localStorage.getItem(this.STORAGE_KEY);
        return tasks ? JSON.parse(tasks) : [];
    },
    
    saveTasks: function(tasks) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    },
    
    addTask: function(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
        return task;
    },
    
    updateTask: function(id, updates) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
            this.saveTasks(tasks);
            return tasks[taskIndex];
        }
        return null;
    },
    
    deleteTask: function(id) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        this.saveTasks(filteredTasks);
        return true;
    }
};
```

**Task Model (js/task.js)**

```javascript
// Task Model and Operations
class Task {
    constructor(text, id = null) {
        this.id = id || Date.now().toString();
        this.text = text;
        this.completed = false;
        this.createdAt = new Date().toISOString();
    }
    
    toggle() {
        this.completed = !this.completed;
        return this;
    }
    
    setText(newText) {
        this.text = newText;
        return this;
    }
}

const TaskManager = {
    tasks: [],
    
    init: function() {
        this.tasks = TaskStorage.getTasks().map(taskData => 
            Object.assign(new Task(), taskData)
        );
        return this;
    },
    
    addTask: function(text) {
        if (!text.trim()) return null;
        
        const task = new Task(text.trim());
        this.tasks.push(task);
        TaskStorage.addTask(task);
        return task;
    },
    
    toggleTask: function(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.toggle();
            TaskStorage.updateTask(id, { completed: task.completed });
            return task;
        }
        return null;
    },
    
    deleteTask: function(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        TaskStorage.deleteTask(id);
        return true;
    },
    
    getTasks: function() {
        return this.tasks;
    }
};
```

**Main Application (js/app.js)**

```javascript
// Main Application Logic
const App = {
    elements: {},
    
    init: function() {
        this.cacheElements();
        this.bindEvents();
        TaskManager.init();
        this.render();
        console.log('Task Manager App initialized');
    },
    
    cacheElements: function() {
        this.elements = {
            taskForm: document.getElementById('task-form'),
            taskInput: document.getElementById('task-input'),
            taskList: document.getElementById('task-list')
        };
    },
    
    bindEvents: function() {
        this.elements.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
    },
    
    addTask: function() {
        const text = this.elements.taskInput.value;
        const task = TaskManager.addTask(text);
        
        if (task) {
            this.elements.taskInput.value = '';
            this.render();
        }
    },
    
    toggleTask: function(id) {
        TaskManager.toggleTask(id);
        this.render();
    },
    
    deleteTask: function(id) {
        TaskManager.deleteTask(id);
        this.render();
    },
    
    render: function() {
        const tasks = TaskManager.getTasks();
        this.elements.taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.elements.taskList.appendChild(taskElement);
        });
    },
    
    createTaskElement: function(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="task-delete" type="button">Delete</button>
        `;
        
        // Bind events
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.task-delete');
        
        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return li;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
```

### 4.3 Quality Gate: Code Review

Run the development checklist:

```
/checklist code-review
```

**Key validations:**
- [ ] Code follows established patterns
- [ ] Proper error handling implemented
- [ ] Accessible HTML structure
- [ ] Responsive CSS design
- [ ] Clean JavaScript with separation of concerns

---

## Step 5: Testing & Validation

Ensure our application works correctly:

### 5.1 Manual Testing

**Test Core Functionality:**
1. **Add Task**: Enter "Learn BMad Method" → Click "Add Task"
2. **Complete Task**: Check the checkbox → Verify strikethrough
3. **Delete Task**: Click "Delete" → Confirm removal
4. **Persistence**: Refresh page → Verify tasks remain

**Test Edge Cases:**
- Empty task submission (should be prevented)
- Long task text (should wrap properly)
- Multiple rapid clicks (should work smoothly)

### 5.2 Quality Gate: Brotherhood Review

Request a Brotherhood review:

```
/brotherhood-review
```

**Review Criteria:**
- ✅ Meets all PRD requirements
- ✅ Clean, maintainable code
- ✅ Proper error handling
- ✅ Accessibility compliance
- ✅ Performance considerations

---

## Step 6: Documentation & Deployment

Complete the project with proper documentation:

### 6.1 Create README.md

```markdown
# Task Manager App

A simple, elegant task management application built with vanilla HTML, CSS, and JavaScript.

## Features
- ✅ Add new tasks
- ✅ Mark tasks as complete
- ✅ Delete tasks
- ✅ Persistent storage (localStorage)
- ✅ Responsive design

## Usage
1. Open `index.html` in your browser
2. Type a task and click "Add Task"
3. Check tasks as complete
4. Delete tasks when no longer needed

## Technical Details
- **No dependencies** - Pure HTML/CSS/JavaScript
- **Local storage** - Data persists between sessions
- **Responsive design** - Works on desktop and mobile
- **Accessible** - Screen reader friendly

## Development Process
This project was built using the BMad Method, demonstrating:
- Requirements analysis with PM persona
- Technical architecture with Architect persona
- Implementation with Developer persona
- Quality gates and UDTM validation
- Brotherhood review process

## File Structure
```
task-manager-app/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── app.js          # Main application logic
│   ├── task.js         # Task model and manager
│   └── storage.js      # Local storage operations
└── README.md           # This file
```

## Next Steps
- [ ] Add task categories/labels
- [ ] Implement task editing
- [ ] Add due dates
- [ ] Export/import functionality
```

### 6.2 Deploy the Application

**Simple Deployment Options:**

1. **Local File System**: Open `index.html` directly in browser
2. **GitHub Pages**: Push to GitHub and enable Pages
3. **Netlify Drag & Drop**: Upload folder to Netlify
4. **Vercel**: Connect GitHub repo to Vercel

---

## Step 7: Reflection & Learning

Capture insights from your first BMad project:

### 7.1 Memory Creation

```
/memory add-project-insights
```

**Key Learnings:**
- BMad Method provides clear structure for development
- Persona switching helps focus on different concerns
- Quality gates prevent issues early
- UDTM ensures thorough thinking
- Brotherhood review catches blind spots

### 7.2 Process Improvements

**What worked well:**
- Clear persona responsibilities
- Incremental quality validation
- Structured thinking approach

**What to improve:**
- Earlier consideration of accessibility
- More thorough edge case testing
- Better integration of design thinking

---

## Congratulations! 🎉

You've successfully built your first project using BMad Method! You've experienced:

✅ **Complete workflow** from requirements to deployment  
✅ **Persona switching** for different development phases  
✅ **Quality gates** ensuring high standards  
✅ **UDTM analysis** for thorough decision-making  
✅ **Brotherhood review** for code quality  
✅ **Memory system** for continuous learning  

## Next Steps

Now that you understand the basics, explore advanced BMad Method features:

<div class="grid cards" markdown>

-   :fontawesome-solid-terminal:{ .lg .middle } **[Master Commands](../commands/quick-reference.md)**

    ---

    Learn all available BMad commands and their advanced usage patterns.

-   :fontawesome-solid-diagram-project:{ .lg .middle } **[Advanced Workflows](first-project.md)**

    ---

    Explore workflows for larger projects, team collaboration, and complex scenarios.

-   :fontawesome-solid-lightbulb:{ .lg .middle } **[Real Examples](first-project.md)**

    ---

    Study real-world examples and common patterns from successful BMad projects.

-   :fontawesome-solid-graduation-cap:{ .lg .middle } **[Best Practices](first-project.md)**

    ---

    Master advanced techniques and patterns for professional BMad development.

</div>

**Ready for more?** Try building a more complex application or explore team collaboration features! 