// ===================
// AngelaMos | 2026
// common.types.ts
// ===================

import { z } from 'zod'

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  })

export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

export const parseApiResponse = <T extends z.ZodTypeAny>(
  schema: T,
  response: unknown
): z.infer<T> => {
  const wrapped = ApiResponseSchema(schema).parse(response)
  return wrapped.data
}
