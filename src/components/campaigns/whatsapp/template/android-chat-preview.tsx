"use client";

import {
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  Phone,
  ExternalLink,
  ArrowLeft,
  MoreVertical,
  VideoIcon,
  PhoneCall,
  Camera,
  Mic,
  Plus,
  CornerUpLeft,
  Send,
  Paperclip,
  Smile,
} from "lucide-react";

interface AndroidChatPreviewProps {
  templateData: any;
  variableValues?: Record<string, string>;
}

export function AndroidChatPreview({ templateData, variableValues = {} }: AndroidChatPreviewProps) {
  const renderHeader = () => {
    if (templateData.header.type === "NONE") return null;

    if (templateData.header.type === "TEXT") {
      return (
        <div className="font-semibold text-sm mb-1.5">
          {templateData.header.content || "Texto del encabezado"}
        </div>
      );
    }

    if (templateData.header.type === "IMAGE") {
      return (
        <div className="mb-1.5 -mx-2 -mt-2">
          {templateData.header.content ? (
            <img
              src={templateData.header.content}
              alt="Header"
              className="w-full rounded-t-xl"
              style={{ aspectRatio: "1.91 / 1", objectFit: "cover" }}
            />
          ) : (
            <div className="w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-xl" style={{ aspectRatio: "1.91 / 1" }}>
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      );
    }

    if (templateData.header.type === "VIDEO") {
      return (
        <div className="mb-1.5 -mx-2 -mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-xl" style={{ aspectRatio: "16 / 9" }}>
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      );
    }

    if (templateData.header.type === "DOCUMENT") {
      return (
        <div className="mb-1.5 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Documento.pdf</p>
            <p className="text-[10px] text-muted-foreground">PDF</p>
          </div>
        </div>
      );
    }

    if (templateData.header.type === "LOCATION") {
      return (
        <div className="mb-1.5 -mx-2 -mt-2">
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-xl">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
        </div>
      );
    }
  };

  const renderBody = () => {
    if (!templateData.body) {
      return (
        <p className="text-gray-400 italic text-xs">
          El mensaje aparecerá aquí...
        </p>
      );
    }

    // Replace variables with user-provided values only
    let bodyText = templateData.body;
    const variables = bodyText.match(/\{\{\d+\}\}/g) || [];
    variables.forEach((variable: string) => {
      // Only replace if user has provided a value
      if (variableValues[variable]) {
        const value = variableValues[variable];
        bodyText = bodyText.replace(variable, value);
      }
    });

    // Apply WhatsApp formatting in the correct order to avoid conflicts
    // Monospace first (triple backticks): ```texto```
    bodyText = bodyText.replace(/```([^`]+?)```/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-[10px]">$1</code>');

    // Bold: **texto** (double asterisk has priority over single)
    bodyText = bodyText.replace(/\*\*([^\*]+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Bold: *texto* (single asterisk, but not if already processed)
    bodyText = bodyText.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<strong class="font-bold">$1</strong>');

    // Italic: __texto__ (double underscore has priority)
    bodyText = bodyText.replace(/__([^_]+?)__/g, '<em class="italic">$1</em>');

    // Italic: _texto_ (single underscore, but not if already processed)
    bodyText = bodyText.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em class="italic">$1</em>');

    // Strikethrough: ~texto~
    bodyText = bodyText.replace(/~([^~\n]+?)~/g, '<del class="line-through">$1</del>');

    return (
      <div
        className="text-xs whitespace-pre-wrap break-words leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bodyText }}
      />
    );
  };

  const renderButtons = () => {
    if (templateData.buttons.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {templateData.buttons.map((button: any) => (
          <button
            key={button.id}
            className="w-full py-1.5 px-2 text-center text-[#1C8854] font-medium text-xs border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5"
          >
            {button.type === "QUICK_REPLY" && (
              <CornerUpLeft className="h-3 w-3" />
            )}
            {button.type === "PHONE_NUMBER" && (
              <Phone className="h-3 w-3" />
            )}
            {button.type === "URL" && (
              <ExternalLink className="h-3 w-3" />
            )}
            {button.text || "Texto del botón"}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .whatsapp-chat-bg-android {
          background-image: url('https://i.pinimg.com/736x/31/04/e0/3104e02012ee109335a5ca2fc52b81db.jpg');
        }
        .dark .whatsapp-chat-bg-android {
          background-image: url('https://i.pinimg.com/736x/cd/3d/62/cd3d628f57875af792c07d6ad262391c.jpg');
        }
      `}</style>

      <div className="mx-auto" style={{ width: "280px" }}>
        {/* Android Phone Frame */}
        <div className="bg-black dark:bg-gray-900 rounded-[2rem] p-1.5 shadow-2xl">
          {/* Screen Container */}
          <div className="relative bg-black dark:bg-gray-900 rounded-[1.75rem] overflow-hidden">
            {/* Front Camera (Centered Punch Hole) */}
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black dark:bg-black rounded-full z-20"></div>

            {/* Screen Content */}
            <div className="bg-white dark:bg-gray-950 rounded-[1.5rem] overflow-hidden">
              {/* Android Status Bar */}
              <div className="bg-[#075E54] dark:bg-gray-950 px-3 pt-3 pb-2">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-white ml-1">9:41</span>
                  <div className="flex items-center gap-1 mr-1">
                    {/* Signal Bars */}
                    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-white">
                      <rect x="0" y="7" width="2" height="4" rx="0.5" fill="currentColor"/>
                      <rect x="3.5" y="5.5" width="2" height="5.5" rx="0.5" fill="currentColor"/>
                      <rect x="7" y="3.5" width="2" height="7.5" rx="0.5" fill="currentColor"/>
                      <rect x="10.5" y="1" width="2" height="10" rx="0.5" fill="currentColor"/>
                    </svg>
                    {/* WiFi */}
                    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-white">
                      <path d="M7.5 11C8.05 11 8.5 10.55 8.5 10C8.5 9.45 8.05 9 7.5 9C6.95 9 6.5 9.45 6.5 10C6.5 10.55 6.95 11 7.5 11Z" fill="currentColor"/>
                      <path d="M7.5 6.5C8.6 6.5 9.6 7 10.2 7.8C10.3 8 10.6 8 10.8 7.9C11 7.8 11 7.5 10.9 7.3C10.1 6.2 8.9 5.5 7.5 5.5C6.1 5.5 4.9 6.2 4.1 7.3C4 7.5 4 7.8 4.2 7.9C4.4 8 4.7 8 4.8 7.8C5.4 7 6.4 6.5 7.5 6.5Z" fill="currentColor"/>
                      <path d="M7.5 3C9.5 3 11.3 3.9 12.5 5.5C12.6 5.7 12.9 5.7 13.1 5.6C13.3 5.5 13.3 5.2 13.2 5C11.8 3.2 9.8 2 7.5 2C5.2 2 3.2 3.2 1.8 5C1.7 5.2 1.7 5.5 1.9 5.6C2.1 5.7 2.4 5.7 2.5 5.5C3.7 3.9 5.5 3 7.5 3Z" fill="currentColor"/>
                    </svg>
                    {/* Battery */}
                    <svg width="20" height="11" viewBox="0 0 20 11" fill="none" className="text-white">
                      <rect x="0.5" y="2" width="16" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                      <rect x="1.5" y="3" width="14" height="5" rx="1" fill="currentColor"/>
                      <path d="M17.5 4C17.5 3.72386 17.7239 3.5 18 3.5H18.5C18.7761 3.5 19 3.72386 19 4V7C19 7.27614 18.7761 7.5 18.5 7.5H18C17.7239 7.5 17.5 7.27614 17.5 7V4Z" fill="currentColor" opacity="0.4"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* WhatsApp Header - Android Style */}
              <div className="bg-[#075E54] dark:bg-gray-950 px-2 py-2">
                <div className="flex items-center gap-2">
                  {/* Back Button */}
                  <button className="p-1">
                    <ArrowLeft className="h-4 w-4 text-white" strokeWidth={2} />
                  </button>

                  {/* Profile Picture */}
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src="https://res.cloudinary.com/dbqgbemui/image/upload/v1761873777/Samsung_Store_deken7.png"
                      alt="Samsung Store"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12px] text-white truncate">Samsung Store</p>
                    <p className="text-[10px] text-gray-200 dark:text-gray-400">en línea</p>
                  </div>

                  {/* Action Buttons */}
                  <button className="p-1">
                    <VideoIcon className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-1">
                    <PhoneCall className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-1">
                    <MoreVertical className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div
                className="px-3 py-3 bg-cover bg-center whatsapp-chat-bg-android"
                style={{ height: "420px" }}
              >
                <div className="flex justify-start">
                  {/* Message Bubble - Received Message (left side) */}
                  <div className="bg-white dark:bg-[#1F2C33] rounded-lg shadow-sm p-2 max-w-[200px]">
                    {renderHeader()}

                    <div className="space-y-1">
                      {renderBody()}

                      {templateData.footer && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          {templateData.footer}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[9px] text-gray-500 dark:text-gray-400 mt-1">
                        <span>10:30</span>
                      </div>
                    </div>

                    {renderButtons()}
                  </div>
                </div>
              </div>

              {/* WhatsApp Input Bar - Android Style */}
              <div className="bg-[#F0F0F0] dark:bg-gray-950 px-2 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-3 py-2 flex items-center gap-2">
                    <Smile className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-1 whitespace-nowrap">Escribe un mensaje</span>
                    <Paperclip className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Camera className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <button className="p-2 bg-[#25D366] rounded-full">
                    <Mic className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Android Navigation Bar (Optional) */}
              <div className="bg-[#F0F0F0] dark:bg-gray-950 flex justify-center py-1">
                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}