"use client";

import { useRouter } from "next/navigation";
import { StripoEditor } from "@/components/campaigns/email/stripo-editor";
import { EmailTemplate } from "@/lib/api";

export default function CrearCampaignEmailPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/marketing/campaigns/templates/email");
  };

  const handleSaved = (template: EmailTemplate) => {
    // Redirect to edit page after first save
    router.push(`/marketing/campaigns/templates/email/${template.id}/edit`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 pt-2 overflow-hidden" style={{ maxWidth: '100vw' }}>
      <StripoEditor onBack={handleBack} onSaved={handleSaved} />
    </div>
  );
}
