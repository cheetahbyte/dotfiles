export type ModelContextUsage = { model: string; percent: number; usd: number | null }
export type ModelContextTokens = { input: number; output: number }

declare module 'claude-code' {
  interface PluginState {
    'model-context': { usage: ModelContextUsage | null; newTokens: ModelContextTokens }
  }
}
