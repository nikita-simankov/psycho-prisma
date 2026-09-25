import { ensureUser } from "@/utils/authentication";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureUser();

  return children;
}
