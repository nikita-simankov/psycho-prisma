import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { SignUpForm } from "./components/sign-up-form"

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>
          Заполните все необходимые данные, чтобы создать аккаунт
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-center w-full gap-2 text-sm">
        <span>Уже есть аккаунт?</span>
        <Link href="/auth/sign-in" className="underline">
          Вход
        </Link>
      </CardFooter>
    </Card>
  )
}
