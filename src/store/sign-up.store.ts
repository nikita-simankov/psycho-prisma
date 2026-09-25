import { create } from "zustand"
import type {
  GeneralInfoFormData,
  WorkInfoFormData,
} from "@/app/auth/sign-up/schema/sign-up.schema"

interface SignUpStore {
  generalInfo: GeneralInfoFormData
  workInfo: WorkInfoFormData
  updateGeneralInfo: (data: GeneralInfoFormData) => void
  updateWorkInfo: (data: WorkInfoFormData) => void
}

export const useSignUpStore = create<SignUpStore>()((set) => ({
  generalInfo: {
    lastName: "",
    name: "",
    middleName: "",
    dateOfBirth: "",
  },

  workInfo: {
    department: "",
    position: "",
  },

  updateGeneralInfo: (data) => set({ generalInfo: data }),
  updateWorkInfo: (data) => set({ workInfo: data }),
}))
