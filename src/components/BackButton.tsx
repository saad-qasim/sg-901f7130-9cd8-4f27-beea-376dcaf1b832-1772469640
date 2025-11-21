import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  // Hide BackButton on home page
  if (router.pathname === "/") {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      رجوع
    </Button>
  );
}
