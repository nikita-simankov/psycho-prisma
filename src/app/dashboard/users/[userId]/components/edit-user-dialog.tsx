"use client"

import { UpdateUserInfoAction } from "@/actions/user/update-user-info-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Properties {
  user: User
}

export default function EditUserDialog({ user }: Properties) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [updatedUserData, setUpdatedUserData] = useState({
    name: user.name,
    surname: user.surname,
    lastName: user.lastName,
    imageURL: user.imageURL,

    rank: user.rank,
    division: user.division,
    servingKind: user.servingKind, 
    servingPeriod: user.servingPeriod
  })

  const mutation = useMutation({
    mutationFn: () => UpdateUserInfoAction(user.id, updatedUserData),

    onSuccess: () => {
      setShowDialog(false)
      router.refresh()
    },

    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя"
      })
    }
  })

  return <Dialog open={showDialog} onOpenChange={setShowDialog}>
    <DialogTrigger asChild>
      <Button>
        <Edit className="w-5 h-5 mr-2" />
        Редактировать
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>Редактировать информацию</DialogHeader>
      <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
          <Label>Фотография</Label>
          <Input type="file" onChange={async (e) => {
            const file = e.target.files![0]
            const fileBuffer = await file.arrayBuffer()
            const fileString = Buffer.from(fileBuffer).toString("base64")

            setUpdatedUserData({
              ...updatedUserData,
              imageURL: fileString,
            })
          }}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Фамилия</Label>
          <Input value={updatedUserData.lastName} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            lastName: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Имя</Label>
          <Input value={updatedUserData.name} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            name: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Отчество</Label>
          <Input value={updatedUserData.surname} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            surname: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Воинское звание</Label>
          <Input value={updatedUserData.rank} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            rank: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Подразделение</Label>
          <Input value={updatedUserData.division} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            division: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Период службы</Label>
          <Input value={updatedUserData.servingPeriod} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            servingPeriod: e.target.value
          })}/>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Вид службы</Label>
          <Input value={updatedUserData.servingKind} onChange={(e) => setUpdatedUserData({
            ...updatedUserData,
            servingKind: e.target.value
          })}/>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          console.log(updatedUserData)
          mutation.mutate()
        }}>Обновить</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}