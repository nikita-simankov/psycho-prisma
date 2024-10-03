import { z } from 'zod'

export const signUpFormSchema = z.object({
  name: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

  surname: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

  lastName: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

  rank: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

  division: z
    .string({
      required_error: 'Обязательное поле'
    })
    .min(0),

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

export type SignUpFormData = z.infer<typeof signUpFormSchema>
