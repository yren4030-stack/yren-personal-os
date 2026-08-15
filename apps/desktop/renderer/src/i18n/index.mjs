/**
 * Renderer-owned lightweight localization layer.
 * Default locale is zh-CN; the architecture allows adding en-US later as
 * another dictionary module, but language switching is intentionally NOT
 * implemented yet.
 */
import { zhCN } from './zh-CN.mjs'

export const currentLocale = 'zh-CN'
export const messages = zhCN

/**
 * Resolve a dot-nested message key, e.g. t('nav.projects').
 * Falls back to the key itself so missing keys degrade visibly, never crash.
 */
export function t(key, vars) {
  const value = key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), messages)
  if (typeof value !== 'string') return key
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}
