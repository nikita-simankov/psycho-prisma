"use client";

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
import { PhoneInput } from "@/components/ui/phone-input";
import { Step, Stepper, useStepper } from "@/components/ui/stepper";
import { useSignUpStore } from "@/store/sign-up.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CredentialsFormData,
  credentialsSchema,
  GeneralInfoFormData,
  generalInfoSchema,
  LivingAddressInfoFormData,
  livingAddressInfoSchema,
  MilitaryInfoFormData,
  militaryInfoSchema,
} from "../schema/sign-up.schema";
import { toast } from "@/hooks/use-toast";
import { Loader2, Router } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/actions/auth/sign-up-action";

const steps = [
  { label: "Шаг 1" },
  { label: "Шаг 2" },
  { label: "Шаг 3" },
  { label: "Шаг 4" },
];

export default function SignUpForm() {
  return (
    <div className="flex flex-col gap-4 max-w-lg w-full">
      <Stepper initialStep={0} steps={steps} className="w-full">
        {steps.map((stepProps, index) => {
          if (index === 0) {
            return (
              <Step key={stepProps.label} {...stepProps}>
                <GeneralInfoForm />
              </Step>
            );
          }

          if (index === 1) {
            return (
              <Step key={stepProps.label} {...stepProps}>
                <LivingAddressInfoForm />
              </Step>
            );
          }

          if (index === 2) {
            return (
              <Step key={stepProps.label} {...stepProps}>
                <MilitaryInfoForm />
              </Step>
            );
          }

          if (index === 3) {
            return (
              <Step key={stepProps.label} {...stepProps}>
                <CredentialsInfoForm />
              </Step>
            );
          }
        })}
      </Stepper>
    </div>
  );
}

function GeneralInfoForm() {
  const { nextStep } = useStepper();
  const store = useSignUpStore((state) => state);
  const form = useForm<GeneralInfoFormData>({
    resolver: zodResolver(generalInfoSchema),
  });

  const onSubmit = (data: GeneralInfoFormData) => {
    store.updateGeneralInfo(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-2 gap-4"
      >
        <FormField
          name="lastName"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Фамилия</FormLabel>
              <FormControl>
                <Input placeholder="Ваша фамилия" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input placeholder="Ваше имя" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="surname"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Отчество</FormLabel>
              <FormControl>
                <Input placeholder="Ваше отчество" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="dateOfBirth"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Дата рождения</FormLabel>
              <FormControl>
                <Input placeholder="XX.XX.XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="col-span-2">
          Далее
        </Button>
      </form>
    </Form>
  );
}

function LivingAddressInfoForm() {
  const { prevStep, nextStep } = useStepper();
  const store = useSignUpStore((state) => state);
  const form = useForm<LivingAddressInfoFormData>({
    resolver: zodResolver(livingAddressInfoSchema),
  });

  const onSubmit = (data: LivingAddressInfoFormData) => {
    store.updateLivingAddressInfo(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="city"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>Город</FormLabel>
                <FormControl>
                  <Input placeholder="Борисов" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="region"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>Область</FormLabel>
                <FormControl>
                  <Input placeholder="Минская область" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="address"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Адрес проживания</FormLabel>
              <FormControl>
                <Input placeholder="ул. Чайковского" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="building"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Номер дома</FormLabel>
              <FormControl>
                <Input placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="appartment"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Номер квартиры</FormLabel>
              <FormControl>
                <Input placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row items-center gap-4">
          <Button variant="secondary" onClick={prevStep} className="w-1/2">
            Назад
          </Button>
          <Button type="submit" className="w-1/2">
            Далее
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MilitaryInfoForm() {
  const { prevStep, nextStep } = useStepper();
  const store = useSignUpStore((state) => state);
  const form = useForm<MilitaryInfoFormData>({
    resolver: zodResolver(militaryInfoSchema),
  });

  const onSubmit = (data: MilitaryInfoFormData) => {
    store.updateMilitaryInfo(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-2 gap-4"
      >
        <FormField
          name="rank"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Звание</FormLabel>
              <FormControl>
                <Input placeholder="Рядовой" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="division"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Подразделение</FormLabel>
              <FormControl>
                <Input placeholder="Название подразделения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="servingKind"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Вид службы</FormLabel>
              <FormControl>
                <Input placeholder="Срочная служба" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="servingPeriod"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Период службы</FormLabel>
              <FormControl>
                <Input placeholder="1 период (1 - 6 месяцев)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="recruitedBy"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Кем призван</FormLabel>
              <FormControl>
                <Input placeholder="РВК Минского района" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="recruitmentDate"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Дата призыва</FormLabel>
              <FormControl>
                <Input placeholder="XX.XX.XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button variant="secondary" onClick={prevStep}>
          Назад
        </Button>
        <Button type="submit">Далее</Button>
      </form>
    </Form>
  );
}

function CredentialsInfoForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const { prevStep } = useStepper();
  const pathname = usePathname();
  const router = useRouter();
  const store = useSignUpStore((state) => state);
  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const signUpMutation = useMutation({
    mutationFn: (formValues: any) => signUp(formValues),

    onSuccess: () => {
      toast({
        title: "Поздравляем!",
        description: "Вы успешно создали аккаунт.",
      });
      router.push("/auth/sign-in");
    },

    onError: (error) => {
      toast({
        title: "Ошибка",
        variant: "destructive",
        description: error.message,
      });
      form.reset();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: any) =>
          signUpMutation.mutate({
            ...store.generalInfo,
            ...store.militaryInfo,
            ...store.livingAddressInfo,
            password: data.password,
            phoneNumber: data.phoneNumber,
            recoveryQuestionAnswer: data.recoveryQuestionAnswer,
          })
        )}
        className="flex flex-col gap-4"
      >
        <FormField
          name="phoneNumber"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Номер телефона</FormLabel>
              <FormControl>
                <PhoneInput
                  defaultCountry="BY"
                  placeholder="Введите номер телефона"
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
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="• • • • • •" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="recoveryQuestionAnswer"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Девичья фамилия матери</FormLabel>
              <FormControl>
                <Input placeholder="Ваш ответ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row items-center gap-4">
          <Button variant="secondary" onClick={prevStep} className="w-1/2">
            Назад
          </Button>
          <Button type="submit" className="w-1/2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Загрузка...
              </>
            ) : (
              "Завершить"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
