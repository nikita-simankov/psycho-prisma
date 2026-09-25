"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { FormData } from "@/utils/constants";

export async function uploadFormData(formData: FormData) {
  const { organization } = await requireMember("manageLibrary");

  return await prisma.form.create({
    data: {
      name: formData.name,
      description: formData.description,
      adminOnly: formData.adminOnly,
      questions: JSON.stringify(formData.questions),
      organizationId: organization.id,
    },
  });
}
