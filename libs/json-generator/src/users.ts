import {
  fakeAvatar,
  fakeEmail,
  fakePhone,
  fakeAddress,
  fakeName,
  fakeCompany,
  fakeISODate,
  fakeColor,
} from './fake'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  avatar_url: string
  phone: string
  company: string
  job_title: string
  address: ReturnType<typeof fakeAddress>
  created_at: string
  last_login_at: string
  is_active: boolean
  role: 'admin' | 'editor' | 'viewer'
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'en' | 'zh' | 'es' | 'fr'
    notifications: { email: boolean; push: boolean }
    accent_color: string
  }
  social_links?: {
    twitter?: string
    github?: string
    linkedin?: string
    website?: string
  }
  metadata?: Record<string, any>
}

const JOB_TITLES = [
  'Software Engineer', 'Product Manager', 'Designer', 'Data Analyst',
  'Marketing Manager', 'DevOps Engineer', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer', 'QA Engineer',
]

const ROLES: User['role'][] = ['admin', 'editor', 'viewer']
const THEMES: User['preferences']['theme'][] = ['light', 'dark', 'system']
const LANGUAGES: User['preferences']['language'][] = ['en', 'zh', 'es', 'fr']

export function generateUser(userId: number): User {
  const name = fakeName(userId)
  const hasSocial = Math.random() > 0.3

  return {
    id: userId,
    username: `user${userId}`,
    email: fakeEmail(userId),
    first_name: name.firstName,
    last_name: name.lastName,
    avatar_url: fakeAvatar(userId, 300),
    phone: fakePhone(),
    company: fakeCompany(),
    job_title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
    address: fakeAddress(userId),
    created_at: fakeISODate(Math.floor(Math.random() * 365)),
    last_login_at: fakeISODate(Math.floor(Math.random() * 30)),
    is_active: Math.random() > 0.1,
    role: ROLES[Math.floor(Math.random() * ROLES.length)],
    preferences: {
      theme: THEMES[Math.floor(Math.random() * THEMES.length)],
      language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)],
      notifications: {
        email: Math.random() > 0.2,
        push: Math.random() > 0.4,
      },
      accent_color: fakeColor(),
    },
    social_links: hasSocial
      ? {
          twitter: Math.random() > 0.5 ? `https://twitter.com/user${userId}` : undefined,
          github: Math.random() > 0.3 ? `https://github.com/user${userId}` : undefined,
          linkedin: Math.random() > 0.6 ? `https://linkedin.com/in/user${userId}` : undefined,
          website: Math.random() > 0.7 ? `https://user${userId}.dev` : undefined,
        }
      : undefined,
    metadata: {
      signup_source: ['web', 'mobile', 'invite'][Math.floor(Math.random() * 3)],
      plan: ['free', 'pro', 'enterprise'][Math.floor(Math.random() * 3)],
    },
  }
}

export function generateUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => generateUser(i + 1))
}
