import { z } from "zod"

export const generalInfoSchema = z.object({
  name: z.string(),
  surname: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
})

export const militaryInfoSchema = z.object({
  rank: z.string(),
  division: z.string(),
  recruitedBy: z.string(),
  servingKind: z.string(),
  servingPeriod: z.string(),
  recruitmentDate: z.string(),
})

export const livingAddressInfoSchema = z.object({
  city: z.string(),
  region: z.string(),
  address: z.string(),
  building: z.string(),
  appartment: z.string(),
})

export const credentialsSchema = z.object({
  password: z.string(),
  phoneNumber: z.string(),
  recoveryQuestionAnswer: z.string(),
})

export type CredentialsFormData = z.infer<typeof credentialsSchema>
export type GeneralInfoFormData = z.infer<typeof generalInfoSchema>
export type MilitaryInfoFormData = z.infer<typeof militaryInfoSchema>
export type LivingAddressInfoFormData = z.infer<typeof livingAddressInfoSchema>