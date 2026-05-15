import api from './api.json'

const HTTP_BASE = import.meta.env.CBOMKIT_HTTP_API_BASE
const WS_BASE = import.meta.env.CBOMKIT_WS_API_BASE
const POLICY_NAME = import.meta.env.CBOMKIT_POLICY_NAME || 'quantum_safe'
const VIEWER_ONLY = String(import.meta.env.CBOMKIT_VIEWER_ONLY).toLowerCase() === 'true'
const APP_TITLE = import.meta.env.CBOMKIT_TITLE || 'CBOMkit'

function joinURL(base: string, endpoint: string): string {
  if (!base) {
    // Allow callers to operate with relative URLs (useful with the Vite dev proxy).
    return `/${endpoint.replace(/^\//, '')}`
  }
  return new URL(endpoint, base).toString()
}

export const API_SCAN_URL = joinURL(WS_BASE, api.SCAN)
export const API_LAST_CBOM_URL = joinURL(HTTP_BASE, api.LAST_CBOMS)
export const API_CHECK_POLICY_URL = joinURL(HTTP_BASE, api.CHECK_POLICY)
export const API_CHECK_POLICY_NAME = POLICY_NAME
export const APP_VIEWER_ONLY = VIEWER_ONLY
export const APP_TITLE_TEXT = APP_TITLE

export function isViewerOnly(): boolean {
  return APP_VIEWER_ONLY
}

export function getTitle(): string {
  return APP_TITLE_TEXT
}
