import { z } from "zod"

export const signInSchema = z.object({
  // Email, or the phone number of an account created before email sign-in.
  identifier: z.string().trim().min(3, "identifier").max(254, "tooLong"),
  password: z.string().min(8, "passwordLength").max(128, "tooLong"),
})

export type SignInFormData = z.infer<typeof signInSchema>
