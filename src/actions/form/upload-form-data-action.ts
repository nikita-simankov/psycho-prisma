"use server";

import { prisma } from "@/utils/database";
import { FormData } from "@/utils/constants";

export async function uploadFormData(formData: FormData) {
  return await prisma.form.create({
    data: {
      name: formData.name,
      description: formData.description,
      questions: JSON.stringify(formData.questions),
    },
  });
}
