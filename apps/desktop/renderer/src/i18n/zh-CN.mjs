/**
 * zh-CN — default user-facing locale for Personal OS.
 * Internal identifiers (API/DTO/error codes) are never translated.
 * Pure data module: no DOM, no window, safe to import in Node tests.
 */
export const zhCN = Object.freeze({
  app: {
    name: 'Personal OS',
    tagline: '你的本地个人工作台',
    version: 'v0.1.0',
  },

  nav: {
    work: '工作',
    home: '首页',
    projects: '项目',
    canvas: '无限画布',
    calendar: '日历',
    knowledge: '知识',
    knowledgeBase: '知识库',
    files: '文件',
    ai: 'AI',
    agent: 'AI 智能体',
    skills: '技能',
    automations: '自动化',
    memory: '记忆',
    system: '系统',
    settings: '设置',
    comingSoon: '开发中',
  },

  common: {
    loading: '加载中…',
    back: '返回',
    open: '打开',
    reject: '拒绝',
    inProgress: '进行中',
    done: '已完成',
    tasksCount: '{n} 个任务',
  },

  home: {
    title: '首页',
    subtitle: '管理你的项目、任务与 AI 工作状态',
    projects: '项目',
    tasks: '任务',
    pendingProposals: '待确认建议',
    localAI: '本地 AI',
    recentProjects: '最近项目',
    recentActivity: '最近活动',
    noProjects: '暂无项目',
    noActivity: '暂无活动记录',
    validationProject: 'Personal OS 验证项目',
    validationMode: '验证模式',
    localMode: '本地 AI',
    aiReady: '已就绪',
    aiStarting: '正在启动',
    aiUnavailable: '暂不可用',
    externalNotUsed: '未调用外部模型',
    externalUsed: '已连接外部模型',
  },

  projects: {
    title: '项目',
    subtitle: '查看和管理当前项目',
    openProject: '打开项目',
    empty: '暂无项目',
  },

  projectDetail: {
    proposeNextStep: 'AI 建议下一步',
    proposing: '正在生成建议…',
    pendingProposals: '待确认建议',
    noPendingProposals: '暂无待确认建议',
    tasks: '任务',
    noTasks: '暂无任务',
    activity: '活动记录',
    noActivity: '暂无活动记录',
    proposalRationale: '建议理由',
    approveAndCreateTask: '批准并创建任务',
    statusPending: '待确认',
    statusApproved: '已批准',
    statusRejected: '已拒绝',
    statusTodo: '待办',
    kindProject: '项目',
    kindTask: '任务',
    kindProposal: '建议',
    taskCount: '{n} 个任务',
    proposalCount: '{n} 条待确认建议',
  },

  settings: {
    title: '设置',
    subtitle: '调整 Personal OS 的外观与偏好',
    appearance: '外观',
    glassMaterial: '玻璃材质',
    frosted: '磨砂',
    transparent: '通透',
    frostIntensity: '磨砂强度',
    transparencyLevel: '通透程度',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
  },

  comingSoon: {
    description: '该功能将在后续版本中提供，敬请期待。',
  },
})
