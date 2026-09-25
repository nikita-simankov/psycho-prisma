import type { PublicUser } from "@/utils/user";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export default function UserAvatar({
  user,
  className,
}: {
  user: PublicUser;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={
          user.imageURL.endsWith(".jpg")
            ? user.imageURL
            : "data:image/jpeg;base64," + user.imageURL
        }
        className={className}
      />
      <AvatarFallback className={className}>
        {user.name[0] + user.surname[0]}
      </AvatarFallback>
    </Avatar>
  );
}
