"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@prisma/client";
import { LogOut, UserCircle, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

type Properties = {
  user: User;
};

export const DashboardNavbarUserButton: React.FC<Properties> = ({ user }) => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src={user.imageURL} />
          <AvatarFallback>{user.name[0] + user.surname[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex flex-row items-center gap-2"
            onClick={() => router.push("/dashboard/users/" + user.id)}
          >
            <UserCircle className="w-[1.2rem] h-[1.2rem]" />
            Мой профиль
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex flex-row items-center gap-2 text-red-500"
            asChild
          >
            <LogOut className="w-[1.2rem] h-[1.2rem] text-red-500" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
