import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function ask(prompt: string, fast = true): Promise<string> {
  const msg = await anthropic.messages.create({
    model: fast ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
}
