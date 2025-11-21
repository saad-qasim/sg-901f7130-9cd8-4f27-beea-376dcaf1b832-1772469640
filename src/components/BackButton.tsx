
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push("/")}
      className="mb-4 gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      رجوع
    </Button>
  );
}
