"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { LogOut, UserCircle, Users2 } from "lucide-react";
import React from "react";

type Properties = {
  user: User;
};

export const DashboardNavbarUserButton: React.FC<Properties> = ({ user }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarFallback>
            {user.lastName.at(0)! + user.name.at(0)!}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex flex-row items-center gap-2">
            <UserCircle className="w-[1.2rem] h-[1.2rem]" />
            Мой профиль
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="flex flex-row items-center gap-2">
            <Users2 className="w-[1.2rem] h-[1.2rem]" />
            Сменить аккаунт
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-row items-center gap-2 text-red-500">
            <LogOut className="w-[1.2rem] h-[1.2rem] text-red-500" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
