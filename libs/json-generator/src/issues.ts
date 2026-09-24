import {
  fakeAvatar,
  fakeEmail,
  fakeName,
  fakeISODate,
  fakeColor,
  fakeIssueType,
  fakeIssueStatus,
  fakePriority,
} from './fake'

export interface UserRef {
  accountId: string
  displayName: string
  email: string
  avatar_url: string
}

export interface Worklog {
  id: string
  author: UserRef
  comment: string
  started: string
  timeSpentSeconds: number
}

export interface CustomField {
  id: string
  name: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'option' | 'user' | 'date'
}

export interface Issue {
  id: string
  key: string
  summary: string
  description: string
  issuetype: string
  status: string
  priority: string
  created: string
  updated: string
  resolved?: string
  reporter: UserRef
  assignee?: UserRef
  labels: string[]
  components: { id: string; name: string }[]
  fixVersions?: { id: string; name: string; released: boolean }[]
  worklogs: Worklog[]
  customfields: CustomField[]
  metadata: {
    project_key: string
    epic_key?: string
    story_points?: number
    theme_color?: string
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PROJECT_KEYS = ['PROJ', 'DEV', 'MOB', 'WEB', 'API', 'INFRA']
const COMPONENTS_POOL = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'QA', 'Design', 'Docs', 'Infra']
const LABELS_POOL = ['bug', 'feature', 'enhancement', 'tech-debt', 'urgent', 'good-first-issue', 'blocked', 'needs-design', 'needs-docs', 'refactor']

const FEATURES = ['dark mode', 'export to CSV', 'bulk edit', 'real-time sync', 'offline mode', 'two-factor authentication', 'custom fields', 'advanced search', 'webhooks', 'rate limiting']
const MODULES = ['auth module', 'user profile', 'dashboard', 'settings page', 'notification system', 'payment flow', 'order management', 'search service', 'logging system', 'cache layer']
const ISSUES_LIST = ['memory leak', 'race condition', 'null pointer exception', 'UI flicker', 'slow query', 'incorrect calculation', 'broken link', 'typo in error message', 'stale cache', 'timeout error']
const METRICS = ['performance', 'reliability', 'scalability', 'maintainability', 'UX']
const TECHNOLOGIES = ['React', 'Vue', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes']

const SUMMARY_TEMPLATES = [
  'Implement ${feature} for ${module}',
  'Fix ${issue} in ${module}',
  'Refactor ${module} to improve ${metric}',
  'Add tests for ${module}',
  'Update documentation for ${feature}',
  'Optimize ${metric} in ${module}',
  'Migrate ${module} to new ${technology}',
  'Resolve ${issue} affecting ${module}',
]

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

function generateSummary(): string {
  return interpolate(pick(SUMMARY_TEMPLATES), {
    feature: pick(FEATURES),
    module: pick(MODULES),
    issue: pick(ISSUES_LIST),
    metric: pick(METRICS),
    technology: pick(TECHNOLOGIES),
  })
}

function generateDescription(summary: string): string {
  return pick([
    `As a user, I want ${summary.toLowerCase()} so that I can be more productive.`,
    `This task involves implementing ${summary.toLowerCase()} with proper error handling and tests.`,
    `There is a bug: ${summary}. Steps to reproduce: 1. Open the app 2. Perform action 3. Observe error.`,
    `We need to refactor this part to improve code quality and reduce technical debt.`,
    `This is a follow-up to a previous issue. The main goal is to ensure ${summary.toLowerCase()}.`,
  ])
}

function fakeAccountId(userId: number): string {
  return `account-${userId.toString().padStart(6, '0')}`
}

function fakeWorklogId(): string {
  const hex = '0123456789abcdef'
  let id = ''
  for (let i = 0; i < 16; i++) id += hex[Math.floor(Math.random() * 16)]
  return id
}

function generateUserRef(userId: number): UserRef {
  const name = fakeName(userId)
  return {
    accountId: fakeAccountId(userId),
    displayName: `${name.firstName} ${name.lastName}`,
    email: fakeEmail(userId, 'company.com'),
    avatar_url: fakeAvatar(userId, 300),
  }
}

function generateWorklog(author: UserRef, daysAgo: number): Worklog {
  return {
    id: fakeWorklogId(),
    author,
    comment: pick([
      'Started working on this.', 'Made progress on the main logic.',
      'Fixed a few edge cases.', 'Waiting for review.',
      'Added unit tests.', 'Updated documentation.',
      'Refactored the module for better readability.',
    ]),
    started: fakeISODate(daysAgo),
    timeSpentSeconds: Math.floor(Math.random() * 8 + 1) * 3600,
  }
}

function generateCustomField(index: number): CustomField {
  const fields: Omit<CustomField, 'value'>[] = [
    { id: 'customfield_10001', name: 'Story Points', type: 'number' },
    { id: 'customfield_10002', name: 'Sprint', type: 'option' },
    { id: 'customfield_10003', name: 'Epic Link', type: 'string' },
    { id: 'customfield_10004', name: 'Assignee Team', type: 'option' },
    { id: 'customfield_10005', name: 'Due Date', type: 'date' },
    { id: 'customfield_10006', name: 'Has Security Impact', type: 'boolean' },
    { id: 'customfield_10007', name: 'Reviewers', type: 'user' },
  ]
  const field = fields[index % fields.length]
  let value: any
  switch (field.type) {
    case 'number': value = Math.floor(Math.random() * 10) + 1; break
    case 'option': value = `Option ${Math.floor(Math.random() * 5) + 1}`; break
    case 'string': value = `EPIC-${Math.floor(Math.random() * 1000)}`; break
    case 'date': value = fakeISODate(Math.floor(Math.random() * 60)); break
    case 'boolean': value = Math.random() > 0.5; break
    case 'user': value = generateUserRef(Math.floor(Math.random() * 100)); break
  }
  return { ...field, value }
}

export function generateIssue(issueIndex: number): Issue {
  const issueNumber = issueIndex + 1
  const projectKey = pick(PROJECT_KEYS)
  const reporter = generateUserRef(Math.floor(Math.random() * 100))
  const assignee = Math.random() > 0.1 ? generateUserRef(Math.floor(Math.random() * 100)) : undefined
  const summary = generateSummary()

  const worklogs: Worklog[] = []
  for (let i = 0; i < Math.floor(Math.random() * 5); i++) {
    worklogs.push(generateWorklog(Math.random() > 0.5 ? reporter : (assignee ?? reporter), Math.floor(Math.random() * 30)))
  }

  const customfields: CustomField[] = []
  for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
    customfields.push(generateCustomField(i))
  }

  return {
    id: `ISSUE-${issueIndex}`,
    key: `${projectKey}-${issueNumber}`,
    summary,
    description: generateDescription(summary),
    issuetype: fakeIssueType(),
    status: fakeIssueStatus(),
    priority: fakePriority(),
    created: fakeISODate(Math.floor(Math.random() * 180)),
    updated: fakeISODate(Math.floor(Math.random() * 30)),
    resolved: Math.random() > 0.3 ? fakeISODate(Math.floor(Math.random() * 15)) : undefined,
    reporter,
    assignee,
    labels: Array.from({ length: Math.floor(Math.random() * 4) }, () => pick(LABELS_POOL)),
    components: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      id: `comp_${i}`,
      name: pick(COMPONENTS_POOL),
    })),
    fixVersions: Math.random() > 0.5 ? [{
      id: 'v1',
      name: `v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      released: Math.random() > 0.5,
    }] : undefined,
    worklogs,
    customfields,
    metadata: {
      project_key: projectKey,
      epic_key: Math.random() > 0.6 ? `${projectKey}-${Math.floor(Math.random() * 100)}` : undefined,
      story_points: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined,
      theme_color: fakeColor(),
    },
  }
}

export function generateIssues(count: number): Issue[] {
  return Array.from({ length: count }, (_, i) => generateIssue(i))
}
