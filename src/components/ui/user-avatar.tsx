import { formatInitials, type PublicUser } from "@/utils/user";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// imageURL holds either a path/URL or a base64-encoded JPEG uploaded by an admin.
function imageSource(imageURL: string) {
  if (!imageURL) {
    return undefined;
  }

  return /^(https?:|\/|data:)/.test(imageURL)
    ? imageURL
    : "data:image/jpeg;base64," + imageURL;
}

export default function UserAvatar({
  user,
  className,
}: {
  user: Pick<PublicUser, "imageURL" | "name" | "lastName">;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage src={imageSource(user.imageURL)} className={className} />
      <AvatarFallback className={className}>{formatInitials(user)}</AvatarFallback>
    </Avatar>
  );
}
