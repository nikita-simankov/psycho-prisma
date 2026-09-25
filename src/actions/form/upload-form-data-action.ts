"use server";

import { requireAdmin } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { FormData } from "@/utils/constants";

export async function uploadFormData(formData: FormData) {
  await requireAdmin();

  return await prisma.form.create({
    data: {
      name: formData.name,
      description: formData.description,
      adminOnly: formData.adminOnly,
      questions: JSON.stringify(formData.questions),
    },
  });
}
