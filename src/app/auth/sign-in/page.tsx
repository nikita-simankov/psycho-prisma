import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { SignInForm } from "./components/sign-in-form"

export default function SignInPage() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Вход</CardTitle>
        <CardDescription>
          Введите свой номер телефона и пароль, чтобы войти в аккаунт
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-center w-full gap-2 text-sm">
        <span>Нету аккаунта?</span>
        <Link href="/auth/sign-up" className="underline">
          Регистрация
        </Link>
      </CardFooter>
    </Card>
  )
}
