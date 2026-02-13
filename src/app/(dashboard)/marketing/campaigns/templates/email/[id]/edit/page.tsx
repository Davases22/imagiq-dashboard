"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UnlayerEmailEditor } from "@/components/campaigns/email/unlayer-email-editor";

export default function EditEmailTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  // Redirect to create page if ID is invalid
  useEffect(() => {
    if (!templateId || templateId === "undefined") {
      router.replace("/marketing/campaigns/crear/email");
    }
  }, [templateId, router]);

  const handleBack = () => {
    router.push("/marketing/campaigns/templates/email");
  };

  const handleSaved = () => {
    // Stay on edit page after saving
  };

  // Don't render editor if ID is invalid
  if (!templateId || templateId === "undefined") {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6">
      <UnlayerEmailEditor
        templateId={templateId}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    </div>
  );
}
