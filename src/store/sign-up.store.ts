import { create } from "zustand"

interface SignUpStore {
  generalInfo: {
    name: string
    surname: string
    lastName: string
    dateOfBirth: string
  }

  militaryInfo: {
    rank: string
    division: string
    recruitedBy: string
    servingKind: string
    servingPeriod: string
    recruitmentDate: string
  }

  credentialsInfo: {
    password: string
    phoneNumber: string
    recoveryQuestionAnswer: string
  }

  livingAddressInfo: {
    city: string
    region: string
    address: string
    building: string
    appartment: string
  }

  updateGeneralInfo: (data: SignUpStore["generalInfo"]) => void
  updateMilitaryInfo: (data: SignUpStore["militaryInfo"]) => void
  updateCredentialsInfo: (data: SignUpStore["credentialsInfo"]) => void
  updateLivingAddressInfo: (data: SignUpStore["livingAddressInfo"]) => void
}

export const useSignUpStore = create<SignUpStore>()((set) => ({
  generalInfo: {
    name: "",
    surname: "",
    lastName: "",
    dateOfBirth: "",
  },

  militaryInfo: {
    rank: "",
    division: "",
    servingKind: "",
    recruitedBy: "",
    servingPeriod: "",
    recruitmentDate: "",
  },

  credentialsInfo: {
    password: "",
    phoneNumber: "",
    recoveryQuestionAnswer: "",
  },

  livingAddressInfo: {
    city: "",
    region: "",
    address: "",
    building: "",
    appartment: "",
  },

  updateGeneralInfo: (data: SignUpStore["generalInfo"]) =>
    set((state) => ({
      generalInfo: {
        ...state.generalInfo,
        ...data,
      },
    })),

  updateMilitaryInfo: (data: SignUpStore["militaryInfo"]) =>
    set((state) => ({
      militaryInfo: {
        ...state.militaryInfo,
        ...data,
      },
    })),

  updateCredentialsInfo: (data: SignUpStore["credentialsInfo"]) =>
    set((state) => ({
      credentialsInfo: {
        ...state.credentialsInfo,
        ...data,
      },
    })),

  updateLivingAddressInfo: (data: SignUpStore["livingAddressInfo"]) =>
    set((state) => ({
      livingAddressInfo: {
        ...state.livingAddressInfo,
        ...data,
      },
    })),
}))
