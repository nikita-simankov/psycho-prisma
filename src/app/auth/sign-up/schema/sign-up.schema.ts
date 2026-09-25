import { z } from "zod"

const text = (max = 200) => z.string().trim().max(max, "tooLong")
const requiredText = (max = 100) => text(max).min(1, "required")

export const generalInfoSchema = z.object({
  lastName: requiredText(),
  name: requiredText(),
  middleName: text(100),
  dateOfBirth: text(20),
})

export const workInfoSchema = z.object({
  department: text(),
  position: text(),
})

export const credentialsSchema = z.object({
  phoneNumber: z.string().min(9, "phone").max(20, "phone"),
  password: z.string().min(8, "passwordLength").max(128, "tooLong"),
  consent: z.literal(true, { errorMap: () => ({ message: "consentRequired" }) }),
})

export type GeneralInfoFormData = z.infer<typeof generalInfoSchema>
export type WorkInfoFormData = z.infer<typeof workInfoSchema>
export type CredentialsFormData = z.infer<typeof credentialsSchema>
