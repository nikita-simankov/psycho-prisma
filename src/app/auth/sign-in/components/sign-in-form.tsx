"use client";

import React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  SignInFormData,
  signInFormSchema,
} from "@/app/auth/sign-in/schema/sign-in-form-schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { signIn } from "@/actions/auth/sign-in-action";

export const SignInForm: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),

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
        description: `Вы успешно вошли как в аккаунт`,
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
        onSubmit={form.handleSubmit((formValues: SignInFormData) =>
          signInMutation.mutate(formValues)
        )}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер телефона</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="+375 (XX) XXX-XX-XX"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <div className="flex flex-row items-center gap-1 px-2 border rounded-md">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="border-none"
                    placeholder={
                      showPassword ? "123456" : "•   •   •   •   •   •"
                    }
                    {...field}
                  />
                  <Button
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="dark:hover:bg-background hover:bg-background"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={signInMutation.isPending}>
          {signInMutation.isPending ? (
            <Loader2 className="text-white animate-spin" />
          ) : (
            "Отправить"
          )}
        </Button>
      </form>
    </Form>
  );
};
