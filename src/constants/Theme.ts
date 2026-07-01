export const Theme = {
  colors: {
    primary: '#D7621E', // Indigo
    secondary: '#c5ae31ff', // Tactical Orange
    accent: '#8a5cff', // Neon Purple
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    text: '#F8FAFC', // Slate 50
    textMuted: '#94A3B8', // Slate 400
    error: '#EF4444',
    danger: '#EF4444',
    success: '#10B981',
    border: '#334155',
    warning: '#F59E0B',
    info: '#3B82F6',
    vulnerabilities: {
      critical: '#EF4444',
      high: '#F97316',
      medium: '#F59E0B',
      low: '#10B981',
      info: '#3B82F6',
    },
    priority: {
      p0: '#EF4444',
      p1: '#F97316',
      p2: '#F59E0B',
      p3: '#3B82F6',
    },
    nodeType: {
      Organization: '#d97706',
      Subdomain: '#3b82f6',
      IPAddress: '#6b7280',
      Application: '#0d9488',
      Technology: '#8b5cf6',
      Certificate: '#06b6d4',
      IdentityInfra: '#a855f7',
      APIEndpoint: '#ec4899',
      APMENode: '#f97316',
      Vulnerability: '#ef4444',
      CVE: '#dc2626',
    },
    edgeType: {
      RESOLVES_TO: '#3b82f6',
      HOSTS: '#0d9488',
      EXPOSES: '#ef4444',
      LEADS_TO: '#f97316',
      DEPENDS_ON: '#a855f7',
      TRUSTS_DOMAIN: '#f59e0b',
      PART_OF: '#06b6d4',
      AUTHENTICATES: '#ec4899',
      AUTHENTICATES_VIA: '#d97706',
      ESCALATES_TO: '#dc2626',
      USES_TECH: '#8b5cf6',
      PROTECTS: '#10b981',
      CONNECTED_TO: '#6b7280',
      TRUSTS: '#f59e0b',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 9999,
  }
};
