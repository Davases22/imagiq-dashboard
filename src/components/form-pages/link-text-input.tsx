"use client";

import { useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LinkTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export function LinkTextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  className,
}: LinkTextInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleInsertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) return;

    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    const markdown = `[${linkText}](${url})`;

    const el = inputRef.current;
    if (el) {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + markdown + value.slice(end);
      onChange(newValue);

      // Restore cursor after the inserted link
      requestAnimationFrame(() => {
        const pos = start + markdown.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    } else {
      onChange(value + markdown);
    }

    setLinkText("");
    setLinkUrl("");
    setOpen(false);
  };

  const sharedProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder,
    className,
  };

  return (
    <div className="relative">
      {multiline ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          {...sharedProps}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          {...sharedProps}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title="Insertar enlace"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <p className="text-sm font-medium">Insertar enlace</p>
            <div className="space-y-1">
              <Label className="text-xs">Texto del enlace</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Términos y condiciones"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL de destino</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={handleInsertLink}
              disabled={!linkText.trim() || !linkUrl.trim()}
            >
              Insertar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
