"use client";

import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, useEffect, useRef, useState } from "react";

interface Properties {
  text: string;
  setText: (text: string) => void;
}

export default function GrowingTextarea({
  text,
  setText,
}: Readonly<Properties>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <Textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        boxSizing: "border-box",
        overflow: "hidden",
        resize: "none",
      }}
      className="print:border-none"
    />
  );
}
