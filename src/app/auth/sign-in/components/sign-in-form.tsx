"use client";

import { signIn } from "@/actions/auth/sign-in-action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { SignInFormData, signInSchema } from "../schema/sign-in.schema";

export default function SignInForm() {
  const router = useRouter();
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),

    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: (formValues: SignInFormData) => signIn(formValues),

    onSuccess: (data) => {
      toast({
        title: "Добро пожаловать!",
        description: `Вы успешно вошли в аккаунт`,
      });

      if (data.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/forms");
      }
    },

    onError: (error) => {
      toast({
        title: "Ошибка входа",
        variant: "destructive",
        description: error.message,
      });

      form.reset();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: SignInFormData) =>
          signInMutation.mutate(data)
        )}
        className="max-w-md w-full flex flex-col gap-4"
      >
        <FormField
          name="phoneNumber"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>Номер телефона</FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder="Введите номер телефона"
                  addInternationalOption
                  defaultCountry="BY"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="flex flex-row items-center justify-between">
                Пароль
              </FormLabel>
              <FormControl>
                <PasswordInput placeholder="• • • • • •" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Отправить</Button>
        <div className="self-center flex flex-row items-center gap-2 text-sm">
          <span className="text-muted-foreground">У вас ещё нет аккаунта?</span>
          <Link
            href="/auth/sign-up"
            className="font-medium underline underline-offset-2"
          >
            Регистрация
          </Link>
        </div>
      </form>
    </Form>
  );
}
