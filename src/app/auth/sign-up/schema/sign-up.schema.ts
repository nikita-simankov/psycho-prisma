import { z } from "zod"

const requiredText = (max = 100) => z.string().trim().min(1, "required").max(max, "tooLong")

export const emailSchema = z.string().trim().toLowerCase().min(1, "required").email("email").max(254, "tooLong")
export const passwordSchema = z.string().min(8, "passwordLength").max(128, "tooLong")
export const consentSchema = z.literal(true, { errorMap: () => ({ message: "consentRequired" }) })

// Account fields shared by sign-up and accepting an invitation.
export const accountSchema = z.object({
  name: requiredText(),
  lastName: requiredText(),
  email: emailSchema,
  password: passwordSchema,
  consent: consentSchema,
})

// Sign-up creates an organization owned by the new account.
export const signUpSchema = accountSchema.extend({
  organization: requiredText(100).pipe(z.string().min(2, "required")),
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type AccountFormData = z.infer<typeof accountSchema>
