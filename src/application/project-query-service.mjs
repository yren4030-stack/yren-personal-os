/**
 * ProjectQueryService — presentation-safe read model over the persisted
 * project/task/proposal records. It never mutates state and returns plain
 * JSON-safe DTOs (never repository/domain internals). The Renderer reads
 * through the facade, never through this service or the repositories.
 */
export class ProjectQueryService {
  constructor({ projectRepository, taskRepository, proposalRepository }) {
    this.projects = projectRepository
    this.tasks = taskRepository
    this.proposals = proposalRepository
  }

  /** ProjectSummaryDTO[] */
  async listProjects() {
    const projects = await this.projects.list()
    const summaries = []
    for (const project of projects) {
      const tasks = await this.tasks.listByProjectId(project.id)
      summaries.push({
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt,
        taskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
      })
    }
    return summaries
  }

  /** ProjectSummaryDTO, or null when the project does not exist. */
  async getProject(projectId) {
    const project = await this.projects.getById(projectId)
    if (!project) return null
    const tasks = await this.tasks.listByProjectId(projectId)
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.createdAt,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
    }
  }

  /** ProjectWorkspaceDTO, or null when the project does not exist. */
  async getWorkspace(projectId) {
    const project = await this.projects.getById(projectId)
    if (!project) return null
    const tasks = await this.tasks.listByProjectId(projectId)
    const proposals = await this.proposals.listByProjectId(projectId)
    return {
      project: { id: project.id, title: project.title, status: project.status, createdAt: project.createdAt },
      tasks: tasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
      })),
      proposals: proposals.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        type: p.type,
        title: p.title,
        rationale: p.rationale,
        status: p.status,
        createdAt: p.createdAt,
      })),
      summary: {
        taskCount: tasks.length,
        pendingProposalCount: proposals.filter((p) => p.status === 'pending-approval').length,
      },
      activity: this.deriveActivity(project, tasks, proposals),
    }
  }

  /** Minimal timeline derived from persisted records only (no fabricated events). */
  deriveActivity(project, tasks, proposals) {
    const items = []
    items.push({ kind: 'project', id: project.id, title: project.title, status: project.status, at: project.createdAt })
    for (const task of tasks) {
      items.push({ kind: 'task', id: task.id, title: task.title, status: task.status, at: task.createdAt })
    }
    for (const proposal of proposals) {
      items.push({ kind: 'proposal', id: proposal.id, title: proposal.title, status: proposal.status, at: proposal.createdAt })
    }
    items.sort((a, b) => (a.at < b.at ? 1 : -1))
    return items
  }
}
