import { z } from 'zod'

export const signInFormSchema = z.object({
  phoneNumber: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

  password: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(6, {
      message: 'Пароль должен состоять из 6 символов и болee'
    })
})

export type SignInFormData = z.infer<typeof signInFormSchema>
