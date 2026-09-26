import { Button } from "@/components/ui/button";
import { enabledProviders, type OAuthProvider } from "@/utils/oauth";
import { getTranslations } from "next-intl/server";

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

// "Continue with Google / Microsoft", shown only for providers the server is set up for.
export async function OAuthButtons({ next }: { next?: string }) {
  const providers = enabledProviders();
  if (!providers.length) {
    return null;
  }
  const t = await getTranslations("auth.oauth");
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((provider) => (
        <Button key={provider} asChild variant="outline" size="lg">
          {/* A full page load: the provider's page can't open inside client navigation. */}
          <a href={`/auth/oauth/${provider}${query}`}>
            <ProviderIcon provider={provider} />
            {t(`continue.${provider}`)}
          </a>
        </Button>
      ))}
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
