import { Badge } from "@/components/ui/badge";

interface SmsPreviewProps {
  fromNumber?: string;
  message?: string;
  companyName?: string;
  includeOptOut?: boolean;
}

export function SmsPreview({
  fromNumber = "+1234567890",
  message = "Tu mensaje SMS aquí...",
  companyName = "Tu Empresa",
  includeOptOut = true
}: SmsPreviewProps) {
  // Calcular longitud del mensaje completo
  const optOutText = includeOptOut ? ` Reply STOP to opt-out.` : "";
  const fullMessage = `${message}${optOutText}`;
  const messageLength = fullMessage.length;
  const maxLength = 160;
  const isOverLimit = messageLength > maxLength;

  return (
    <div className="max-w-sm mx-auto">
      {/* Phone Mockup */}
      <div className="relative mx-auto bg-black rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-gray-900 rounded-[2rem] h-[600px] overflow-hidden">
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 py-2 text-white text-sm">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <span className="ml-2 text-xs">Carrier</span>
            </div>
            <div className="text-xs">12:34 PM</div>
            <div className="flex items-center gap-1">
              <div className="text-xs">100%</div>
              <div className="w-6 h-3 border border-white rounded-sm">
                <div className="w-full h-full bg-green-500 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Messages Header */}
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                {companyName.charAt(0)}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{companyName}</div>
                <div className="text-gray-400 text-xs">{fromNumber}</div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="p-4 h-full bg-black">
            <div className="space-y-4">
              {/* Previous message for context */}
              <div className="flex justify-end">
                <div className="bg-green-600 text-white p-3 rounded-2xl max-w-xs text-sm">
                  Hola, me interesa saber más sobre sus productos.
                </div>
              </div>

              {/* SMS Preview */}
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white p-3 rounded-2xl max-w-xs">
                  <div className="text-sm whitespace-pre-wrap">
                    {fullMessage || "Tu mensaje SMS aparecerá aquí..."}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Delivered • 12:34 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Character Counter */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className={`text-center p-2 rounded-lg ${
                isOverLimit ? 'bg-red-900/50 text-red-300' : 'bg-gray-800/50 text-gray-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                    {messageLength}/{maxLength}
                  </Badge>
                  {isOverLimit && (
                    <span className="text-xs">Mensaje muy largo</span>
                  )}
                </div>
                {messageLength > 160 && messageLength <= 306 && (
                  <div className="text-xs mt-1">
                    Se enviará como {Math.ceil(messageLength / 153)} mensajes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Stats */}
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Caracteres</div>
            <div className={isOverLimit ? "text-red-600" : "text-green-600"}>
              {messageLength}/160
            </div>
          </div>
          <div>
            <div className="font-medium">Segmentos</div>
            <div className="text-gray-600">
              {messageLength <= 160 ? 1 : Math.ceil(messageLength / 153)}
            </div>
          </div>
        </div>
        {messageLength > 160 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Los mensajes de más de 160 caracteres se dividen en múltiples SMS.
          </div>
        )}
      </div>
    </div>
  );
}