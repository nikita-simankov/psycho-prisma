import Image from "next/image"
import SignUpForm from "./components/sign-up-form"
import Link from "next/link"

export default function SignInPage() {
  return (
    <main className="flex flex-row">
      <div className="bg-white w-full h-dvh flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-bold">Регистрация</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Укажите необходимую информацию о себе, чтобы зарегистрироваться в
            системе тестирования военнослужащих
          </p>
        </div>
        <SignUpForm />
        <div className="self-center flex flex-row items-center gap-2 text-sm">
          <span className="text-muted-foreground">У вас уже есть аккаунт?</span>
          <Link
            href="/auth/sign-in"
            className="font-medium underline underline-offset-2"
          >
            Вход
          </Link>
        </div>
      </div>
    </main>
  )
}
