"use client";

import React from "react";

import {
  SignUpFormData,
  signUpFormSchema,
} from "@/app/auth/sign-up/schema/sign-up-form-schema";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "@/actions/auth/sign-up-action";
import { toast } from "sonner";

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),

    defaultValues: {
      name: "",
      surname: "",
      lastName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (formValues: SignUpFormData) => signUp(formValues),

    onSuccess: () => {
      toast.success(`Вы успешно создали аккаунт.`);
      router.push("/auth/sign-in");
    },

    onError: (error) => {
      toast.error(error.message);
      form.reset();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((formValues: SignUpFormData) =>
          signUpMutation.mutate(formValues)
        )}
        className="grid grid-cols-3 gap-4"
      >
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Фамилия</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Фамилия" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Имя" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Отчество</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Отчество" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem className="col-span-3">
              <FormLabel>Воинское звание</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Рядовой" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="division"
          render={({ field }) => (
            <FormItem className="col-span-3">
              <FormLabel>Подразделение</FormLabel>
              <FormControl>
                <Input type="text" placeholder="ИТБ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="col-span-3">
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
            <FormItem className="col-span-3">
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

        <Button
          type="submit"
          disabled={signUpMutation.isPending}
          className="col-span-3"
        >
          {signUpMutation.isPending ? (
            <Loader2 className="text-white animate-spin" />
          ) : (
            "Отправить"
          )}
        </Button>
      </form>
    </Form>
  );
};
