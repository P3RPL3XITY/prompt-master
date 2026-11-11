export type Phase = 'idle' | 'working'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { hasDraft: boolean; phase: Phase; original: string | null }
  }
}
