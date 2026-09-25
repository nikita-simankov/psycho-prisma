import { z } from "zod"

export const signInSchema = z.object({
  phoneNumber: z.string().min(9, "phone").max(20, "phone"),
  password: z.string().min(8, "passwordLength").max(128, "tooLong"),
})

export type SignInFormData = z.infer<typeof signInSchema>
