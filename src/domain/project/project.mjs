import { randomUUID } from 'node:crypto'

function requiredText(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${name} is required`)
  return value.trim()
}

export function createProject({ id = randomUUID(), title, status = 'active', createdAt = new Date().toISOString() }) {
  return Object.freeze({
    id: requiredText(id, 'project.id'),
    title: requiredText(title, 'project.title'),
    status,
    createdAt,
  })
}

export function createTask({
  id = randomUUID(),
  projectId,
  title,
  status = 'todo',
  priority = 'normal',
  createdAt = new Date().toISOString(),
}) {
  return Object.freeze({
    id: requiredText(id, 'task.id'),
    projectId: requiredText(projectId, 'task.projectId'),
    title: requiredText(title, 'task.title'),
    status,
    priority,
    createdAt,
  })
}

export function createReadonlyProjectContext(project, tasks) {
  if (!project) throw new TypeError('project is required')
  const taskViews = tasks.map(task => Object.freeze({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
  }))
  return Object.freeze({
    project: Object.freeze({
      id: project.id,
      title: project.title,
      status: project.status,
    }),
    tasks: Object.freeze(taskViews),
  })
}
