"use client";

import { useRouter } from "next/navigation";
import { GrapesJSEmailEditor } from "@/components/campaigns/email/grapesjs-email-editor";
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
      <GrapesJSEmailEditor onBack={handleBack} onSaved={handleSaved} />
    </div>
  );
}
