import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/components/ui/logo";
import { ClipboardCheck, EyeOff, Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ReactNode } from "react";

const POINTS = [
  { key: "consent", icon: ClipboardCheck },
  { key: "access", icon: EyeOff },
  { key: "judgement", icon: Scale },
] as const;

type Properties = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// Split layout for sign-in and sign-up: form on the left, brand panel on the right.
export async function AuthShell({ title, subtitle, children }: Properties) {
  const t = await getTranslations();

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo withText />
          </Link>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link href="/" className="relative w-fit rounded-xl bg-background px-3 py-2 text-foreground">
          <Logo withText />
        </Link>
        <div className="relative flex max-w-md flex-col gap-8">
          <p className="font-heading text-3xl font-semibold leading-tight">{t("auth.signIn.aside")}</p>
          <ul className="flex flex-col gap-5">
            {POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">{t(`landing.trust.${key}.title`)}</p>
                  <p className="text-sm opacity-80">{t(`landing.trust.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">{t("landing.footer.disclaimer")}</p>
      </aside>
    </main>
  );
}
