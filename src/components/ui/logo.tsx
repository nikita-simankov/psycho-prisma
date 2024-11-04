import { Triangle } from "lucide-react";

interface Properties {
  withText?: boolean;
}

export default function Logo({ withText }: Properties) {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="w-9 h-9 bg-primary dark:bg-primary rounded-md flex flex-col items-center justify-center">
        <Triangle className="w-5 h-5 fill-white text-white" />
      </div>
      {withText && <span className="font-bold text-md">Призма</span>}
    </div>
  );
}
