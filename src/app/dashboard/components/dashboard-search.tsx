"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Form, Test, User } from "@prisma/client";
import {
  FlaskConical,
  Home,
  NotepadText,
  Smile,
  UserIcon,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface Properties {
  users: User[];
  forms: Form[];
  tests: Test[];
}

export default function DashboardSearch({
  users,
  forms,
  tests,
}: Readonly<Properties>) {
  const router = useRouter();
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <>
      <Input placeholder="Поиск" onClick={() => setOpen(true)} />
      <CommandDialog modal={true} open={isOpen} onOpenChange={setOpen}>
        <CommandInput placeholder="Быстрый поиск по приложению" />
        <CommandList>
          <CommandEmpty>Нет результатов.</CommandEmpty>
          <CommandGroup heading="Навигация">
            <CommandItem
              onSelect={() => {
                router.push("/dashboard");
                setOpen(false);
              }}
              className="flex flex-row items-center gap-2"
            >
              <Home />
              <span className="text-xs font-medium">Панель управления</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/forms");
                setOpen(false);
              }}
              className="flex flex-row items-center gap-2"
            >
              <NotepadText />
              <span className="text-xs font-medium">Анкетирование</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/tests");
                setOpen(false);
              }}
              className="flex flex-row items-center gap-2"
            >
              <FlaskConical />
              <span className="text-xs font-medium">Тестирование</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/summary");
                setOpen(false);
              }}
              className="flex flex-row items-center gap-2"
            >
              <Smile />
              <span className="text-xs font-medium">Характеристика</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/users");
                setOpen(false);
              }}
              className="flex flex-row items-center gap-2"
            >
              <Users />
              <span className="text-xs font-medium">Личный состав</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Пользователи">
            {users?.map((user) => {
              return (
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/users/" + user.id);
                    setOpen(false);
                  }}
                  className="flex flex-row items-center justify-between gap-2"
                >
                  <div className="flex flex-row items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    <span className="text-xs font-medium">
                      {user.lastName} {user.name} {user.surname}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user.rank}, {user.division}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Анкетирование">
            {forms?.map((form) => {
              return (
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/forms/" + form.id + "/results");
                    setOpen(false);
                  }}
                  className="flex flex-row items-center justify-between gap-2"
                >
                  <div className="flex flex-row items-center gap-2">
                    <NotepadText className="w-5 h-5" />
                    <span className="text-xs font-medium">{form.name}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Тестирование">
            {tests?.map((test) => {
              return (
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/tests/" + test.id + "/results");
                    setOpen(false);
                  }}
                  className="flex flex-row items-center justify-between gap-2"
                >
                  <div className="flex flex-row items-center gap-2">
                    <FlaskConical className="w-5 h-5" />
                    <span className="text-xs font-medium">{test.name}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
