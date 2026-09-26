"use server";

import { requireMember } from "@/utils/authentication";
import { requireFeature } from "@/utils/billing";
import { prisma } from "@/utils/database";
import { FormData } from "@/utils/constants";

export async function uploadFormData(formData: FormData) {
  const { organization } = await requireMember("manageLibrary");
  await requireFeature(organization.id, "studio", true);

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
