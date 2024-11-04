import { z } from "zod"

export const signInSchema = z.object({
  phoneNumber: z.string({
    required_error: "Обязательное поле"
  }).min(9, {
    message: "Неверный формат номера телефона"
  }),
  
  password: z.string({
    required_error: "Обязательное поле"
  }).min(8, {
    message: "Пароль должен содержать не менее 8 символов"
  }),
})

export type SignInFormData = z.infer<typeof signInSchema>