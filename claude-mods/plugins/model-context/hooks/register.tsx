import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ModelContextTokens, ModelContextUsage } from '../types'

const WIDTH = 10
const usage = atom({ plugin: 'model-context', key: 'usage' } as const, null)
const NO_TOKENS: ModelContextTokens = { input: 0, output: 0 }
const tokens = atom({ plugin: 'model-context', key: 'newTokens' } as const, NO_TOKENS)

const refresh = async ($: EngineInterface) => {
  const [model, session] = await Promise.all([$.session.model(), $.session.usage()])
  const next: ModelContextUsage = {
    model,
    percent: session.context.percent ?? 0,
    usd: session.cost?.usd ?? null,
  }

  await update($, usage, () => next)
}

const fillColor = (percent: number) => {
  if (percent >= 80) {
    return 'red'
  }

  return percent >= 50 ? 'yellow' : 'green'
}

const compact = (count: number) => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }

  return count >= 1_000 ? `${(count / 1_000).toFixed(1)}k` : `${count}`
}

const CYCLE = /\s*\(?shift\+tab to cycle\)?/
const MODE = /([^\w\s·]+)\s+[a-z][a-z ]*? on\b/

const trimHint = (hint: string) => {
  const stripped = hint.replace(CYCLE, '')
  const mode = MODE.exec(stripped)
  const rest = (mode === null ? stripped : stripped.replace(MODE, ''))
    .split(/\s*·\s*/)
    .map(part => part.trim())
    .filter(part => part !== '')

  return [...rest, ...(mode?.[1] === undefined ? [] : [mode[1]])].join(' · ')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('turn.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const spent = e.usage

    if (spent !== undefined) {
      await update($, tokens, previous => ({
        input: previous.input + spent.input_tokens + spent.cache_creation_input_tokens,
        output: previous.output + spent.output_tokens,
      }))
    }

    const result = await next(e)
    await refresh($)

    return result
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const current = await read($, usage)

    if (current === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const filled = Math.min(WIDTH, Math.floor((current.percent * WIDTH) / 100))
    const color = fillColor(current.percent)
    const hint = trimHint(e.props.hint)
    const total = await read($, tokens)

    return (
      <Box>
        <Text color="cyan" bold>
          [{current.model}]
        </Text>
        <Text dimColor> · </Text>
        <Text color={color}>{'█'.repeat(filled)}</Text>
        <Text dimColor>{'░'.repeat(WIDTH - filled)}</Text>
        <Text color={color}> {current.percent}%</Text>
        {current.usd === null ? null : <Text dimColor> · </Text>}
        {current.usd === null ? null : <Text color="magenta">[${current.usd.toFixed(2)}]</Text>}
        <Text dimColor> · </Text>
        <Text color="blue">
          [{compact(total.input)} / {compact(total.output)}]
        </Text>
        {hint === '' ? null : <Text dimColor> · {hint}</Text>}
      </Box>
    )
  })
}
