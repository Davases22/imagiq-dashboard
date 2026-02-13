"use client";

import { useRouter } from "next/navigation";
import { UnlayerEmailEditor } from "@/components/campaigns/email/unlayer-email-editor";
import { EmailTemplate } from "@/lib/api";

export default function CrearCampaignEmailPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/marketing/campaigns/templates/email");
  };

  const handleSaved = (template: EmailTemplate) => {
    router.push(`/marketing/campaigns/templates/email/${template.id}/edit`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-6">
      <UnlayerEmailEditor onBack={handleBack} onSaved={handleSaved} />
    </div>
  );
}
