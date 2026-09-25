"use client";

import { signUp } from "@/actions/auth/sign-up-action";
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
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Step, Stepper, useStepper } from "@/components/ui/stepper";
import { toast } from "@/hooks/use-toast";
import { useSignUpStore } from "@/store/sign-up.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Control, FieldValues, Path, useForm } from "react-hook-form";
import {
  CredentialsFormData,
  credentialsSchema,
  GeneralInfoFormData,
  generalInfoSchema,
  WorkInfoFormData,
  workInfoSchema,
} from "../schema/sign-up.schema";

export default function SignUpForm() {
  const t = useTranslations("auth.signUp.steps");
  const steps = [
    { label: t("personal") },
    { label: t("work") },
    { label: t("account") },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-lg w-full">
      <Stepper initialStep={0} steps={steps} className="w-full">
        <Step key="personal" {...steps[0]}>
          <GeneralInfoForm />
        </Step>
        <Step key="work" {...steps[1]}>
          <WorkInfoForm />
        </Step>
        <Step key="account" {...steps[2]}>
          <CredentialsForm />
        </Step>
      </Stepper>
    </div>
  );
}

function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function StepButtons({ loading }: { loading?: boolean }) {
  const common = useTranslations("common");
  const { prevStep, isDisabledStep, isLastStep } = useStepper();

  return (
    <div className="col-span-2 flex flex-row items-center gap-4">
      <Button
        type="button"
        variant="secondary"
        onClick={prevStep}
        disabled={isDisabledStep}
        className="w-1/2"
      >
        {common("back")}
      </Button>
      <Button type="submit" className="w-1/2" disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2" />}
        {isLastStep ? common("finish") : common("next")}
      </Button>
    </div>
  );
}

function GeneralInfoForm() {
  const t = useTranslations("profile.fields");
  const { nextStep } = useStepper();
  const store = useSignUpStore();
  const form = useForm<GeneralInfoFormData>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: store.generalInfo,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          store.updateGeneralInfo(data);
          nextStep();
        })}
        className="grid grid-cols-2 gap-4"
      >
        <TextField control={form.control} name="lastName" label={t("lastName")} />
        <TextField control={form.control} name="name" label={t("name")} />
        <TextField control={form.control} name="middleName" label={t("middleName")} />
        <TextField
          control={form.control}
          name="dateOfBirth"
          label={t("dateOfBirth")}
          placeholder={t("datePlaceholder")}
        />
        <StepButtons />
      </form>
    </Form>
  );
}

function WorkInfoForm() {
  const t = useTranslations("profile.fields");
  const { nextStep } = useStepper();
  const store = useSignUpStore();
  const form = useForm<WorkInfoFormData>({
    resolver: zodResolver(workInfoSchema),
    defaultValues: store.workInfo,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          store.updateWorkInfo(data);
          nextStep();
        })}
        className="grid grid-cols-2 gap-4"
      >
        <TextField
          control={form.control}
          name="department"
          label={t("department")}
          placeholder={t("departmentPlaceholder")}
        />
        <TextField
          control={form.control}
          name="position"
          label={t("position")}
          placeholder={t("positionPlaceholder")}
        />
        <StepButtons />
      </form>
    </Form>
  );
}

function CredentialsForm() {
  const t = useTranslations("profile.fields");
  const messages = useTranslations("auth.signUp");
  const router = useRouter();
  const store = useSignUpStore();
  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { phoneNumber: "", password: "" },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: CredentialsFormData) => {
      const result = await signUp({
        ...store.generalInfo,
        ...store.workInfo,
        ...data,
      });

      if ("error" in result) {
        throw new Error(messages(`errors.${result.error}`));
      }
    },

    onSuccess: () => {
      toast({
        title: messages("successTitle"),
        description: messages("successText"),
      });
      router.push("/auth/sign-in");
    },

    onError: (error) => {
      toast({
        title: messages("errorTitle"),
        variant: "destructive",
        description: error.message,
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => signUpMutation.mutate(data))}
        className="grid grid-cols-2 gap-4"
      >
        <FormField
          name="phoneNumber"
          control={form.control}
          render={({ field }) => (
            <FormItem className="col-span-2 flex flex-col gap-2">
              <FormLabel>{t("phoneNumber")}</FormLabel>
              <FormControl>
                <PhoneInput
                  international
                  placeholder={t("phonePlaceholder")}
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
            <FormItem className="col-span-2 flex flex-col gap-2">
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <PasswordInput placeholder="• • • • • • • •" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <StepButtons loading={signUpMutation.isPending} />
      </form>
    </Form>
  );
}
