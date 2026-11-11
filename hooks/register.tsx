import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Phase } from '../types'

const hasDraft = atom({ plugin: 'prompt-master', key: 'hasDraft' } as const, false)
const phase = atom({ plugin: 'prompt-master', key: 'phase' } as const, 'idle' as Phase)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, null as string | null)

const SYSTEM = `You are Prompt Master, an expert prompt engineer. The user gives you a rough draft of a message they are about to send to an AI assistant (Claude). Rewrite it into a better prompt.

Rules:
- Keep the user's intent, facts, names, file paths, code and constraints exactly. Never invent requirements, data or context they did not give.
- Make the goal explicit up front, then add useful structure: context, the concrete task, constraints, and what a good result looks like (format, length, done-criteria) — only where the draft implies them.
- Fix spelling and grammar; remove filler. Keep it as short as it can be while being clear. A one-line ask can stay a few lines.
- Write in the user's voice (first person, addressed to the assistant). Keep their language.
- If something essential is ambiguous, add a brief line asking the assistant to state its assumptions rather than guessing silently.
- Output ONLY the rewritten prompt text. No preamble, no quotes, no markdown fences, no commentary.`

async function master($: EngineInterface) {
  if ((await read($, phase)) === 'working') return
  const { text } = await $.prompt.read()
  const draft = text.trim()
  if (!draft) {
    $.ui.toast('Prompt Master: type a rough prompt first')
    return
  }
  await update($, phase, () => 'working' as Phase)
  try {
    const r = await $.model.complete({
      model: 'sonnet',
      system: SYSTEM,
      prompt: `Rough draft to rewrite:\n\n<draft>\n${draft}\n</draft>`,
      maxTokens: 2000,
    })
    if (!r.isAnswered) {
      $.ui.toast(`Prompt Master failed (${r.reason})`)
      return
    }
    const better = r.text.trim().replace(/^```[a-z]*\n?|\n?```$/g, '').trim()
    if (!better) {
      $.ui.toast('Prompt Master: got an empty rewrite')
      return
    }
    const filled = await $.prompt.fill({ text: better, mode: 'replace' })
    if (filled.isFilled) {
      await update($, original, () => text)
      $.ui.toast('✨ Prompt rewritten — review it, then send')
    } else {
      $.ui.toast('Prompt Master: could not update the prompt box')
    }
  } finally {
    await update($, phase, () => 'idle' as Phase)
  }
}

async function undo($: EngineInterface) {
  const prev = await read($, original)
  if (prev === null) return
  await $.prompt.fill({ text: prev, mode: 'replace' })
  await update($, original, () => null)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Rewrite the draft in the prompt box into a better prompt',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async $ => {
    await master($).catch(() => $.ui.toast('Prompt Master failed'))
    return { text: '' }
  })

  on('prompt.change', async ($, e, next) => {
    const has = e.text.trim().length > 0
    if ((await read($, hasDraft)) !== has) await update($, hasDraft, () => has)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    try {
      await update($, original, () => null)
      await update($, hasDraft, () => false)
    } catch {}
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking) return next(e)
    const busy = (await read($, phase)) === 'working'
    const prev = await read($, original)

    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        {busy ? (
          <Text dimColor>✨ Prompt Master is rewriting your prompt…</Text>
        ) : (
          <Button key="master" label="✨ Prompt Master" onPress={() => master($)} />
        )}
        {!busy && prev !== null ? (
          <Button key="undo" label="Undo rewrite" onPress={() => undo($)} />
        ) : null}
      </Box>
    )
  })
}
