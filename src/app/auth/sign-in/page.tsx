import Image from "next/image"
import SignInForm from "./components/sign-in-form"

export default function SignInPage() {
  return (
    <main className="flex flex-row">
      <div className="bg-white w-1/2 h-dvh flex flex-col gap-6 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-bold">Добро пожаловать!</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Введите номер телефона и пароль, которые вы указывали при
            регистрации, чтобы войти в аккаунт
          </p>
        </div>
        <SignInForm />
      </div>
      <div className="bg-accent w-1/2 h-dvh flex flex-col items-center justify-center">
        <Image src="/chevron.png" alt="chevron" width={320} height={320} />
      </div>
    </main>
  )
}
