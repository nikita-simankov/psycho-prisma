import { z } from "zod"

const text = (max = 200) => z.string().trim().max(max)

export const generalInfoSchema = z.object({
  name: text(100),
  surname: text(100),
  lastName: text(100),
  dateOfBirth: text(20),
})

export const militaryInfoSchema = z.object({
  rank: text(),
  division: text(),
  recruitedBy: text(),
  servingKind: text(),
  servingPeriod: text(),
  recruitmentDate: text(20),
})

export const livingAddressInfoSchema = z.object({
  city: text(),
  region: text(),
  address: text(),
  building: text(20),
  appartment: text(20),
})

export const credentialsSchema = z.object({
  password: z.string().min(8, {
    message: "Пароль должен содержать не менее 8 символов"
  }).max(128),
  phoneNumber: z.string().min(9, {
    message: "Неверный формат номера телефона"
  }).max(20),
  recoveryQuestionAnswer: text(),
})

export type CredentialsFormData = z.infer<typeof credentialsSchema>
export type GeneralInfoFormData = z.infer<typeof generalInfoSchema>
export type MilitaryInfoFormData = z.infer<typeof militaryInfoSchema>
export type LivingAddressInfoFormData = z.infer<typeof livingAddressInfoSchema>
