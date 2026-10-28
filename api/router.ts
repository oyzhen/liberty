import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { generateText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createRouter, publicQuery } from './middleware'
import { getDb } from './queries/connection'
import { progress } from '@db/schema'
import { listModels, classifyAiError, AiUnavailable, ContentRejected, AiMisconfigured } from './ai/client'

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  progress: createRouter({
    status: publicQuery.query(() => ({ available: Boolean(process.env.DATABASE_URL) })),
    load: publicQuery.input(z.object({ playerKey: z.string().min(8).max(128) })).query(async ({ input }) => {
      const row = await getDb().query.progress.findFirst({ where: eq(progress.playerKey, input.playerKey) })
      return { data: row?.data ?? null, updatedAt: row?.updatedAt ?? null }
    }),
    save: publicQuery.input(z.object({ playerKey: z.string().min(8).max(128), data: z.string().min(2).max(2_000_000) })).mutation(async ({ input }) => {
      const parsed = JSON.parse(input.data) as { version?: number; playerKey?: string }
      if (parsed.version !== 2 || parsed.playerKey !== input.playerKey) throw new Error('Invalid progress payload')
      await getDb().insert(progress).values(input).onDuplicateKeyUpdate({ set: { data: input.data, updatedAt: new Date() } })
      return { saved: true, updatedAt: new Date() }
    }),
  }),
  tutor: createRouter({
    ask: publicQuery.input(z.object({ question: z.string().min(1).max(800), context: z.string().max(1000), moves: z.array(z.string().max(30)).max(20) })).mutation(async ({ input }) => {
      try {
        const { defaultModelId } = await listModels()
        const gateway = createOpenAICompatible({ name: 'kimi-gw', baseURL: process.env.KIMI_AGENTGW_BASE_URL!, apiKey: process.env.KIMI_AGENTGW_API_KEY!, includeUsage: true })
        const result = await generateText({
          model: gateway(defaultModelId),
          system: '你是“弈境”的围棋助教。用简体中文回答，温和、清晰、老少咸宜。优先解释气、连接、眼位、厚薄、先后手和全局判断。不要虚构引擎胜率或精确目数；没有看到完整棋盘时必须说明局限。初学回答控制在180字内，可分三点。不要替玩家声称某手必然最佳。',
          prompt: `当前局面摘要：${input.context}\n最近着手：${input.moves.join('、') || '暂无'}\n棋友问题：${input.question}`,
          maxOutputTokens: 650,
        })
        return { answer: result.text, source: 'model' as const }
      } catch (error) {
        const classified = classifyAiError(error)
        if (classified instanceof AiUnavailable) return { answer: '大模型额度当前不可用。你仍可继续对弈，并使用本地棋理提示。', source: 'local' as const }
        if (classified instanceof ContentRejected) return { answer: '这个问题暂时无法由 AI 回答，请换一种与围棋相关的问法。', source: 'local' as const }
        if (classified instanceof AiMisconfigured) return { answer: '大模型助教尚未完成平台供给。当前可正常使用本地对弈、闯关和棋理提示。', source: 'local' as const }
        return { answer: '大模型助教暂时繁忙，请稍后主动重试。为避免重复消耗额度，本次未自动重试。', source: 'local' as const }
      }
    }),
  }),
})

export type AppRouter = typeof appRouter
