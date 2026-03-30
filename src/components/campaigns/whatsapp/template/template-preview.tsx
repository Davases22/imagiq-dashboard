"use client";

import {
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  Phone,
  ExternalLink,
  ChevronLeft,
  VideoIcon,
  PhoneCall,
  Camera,
  Mic,
  Plus,
  CornerUpLeft,
} from "lucide-react";
import { IOSNotificationPreview } from "./ios-notification-preview";
import { AndroidNotificationPreview } from "./android-notification-preview";
import { IOSNotificationClosedPreview } from "./ios-notification-closed-preview";
import { AndroidNotificationClosedPreview } from "./android-notification-closed-preview";
import { AndroidChatPreview } from "./android-chat-preview";

interface TemplatePreviewProps {
  templateData: any;
  variableValues?: Record<string, string>;
  selectedOS?: 'ios' | 'android';
}

export function WhatsAppTemplatePreview({ templateData, variableValues = {}, selectedOS = 'ios' }: TemplatePreviewProps) {
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
        .whatsapp-chat-bg {
          background-image: url('https://i.pinimg.com/736x/31/04/e0/3104e02012ee109335a5ca2fc52b81db.jpg');
        }
        .dark .whatsapp-chat-bg {
          background-image: url('https://i.pinimg.com/736x/cd/3d/62/cd3d628f57875af792c07d6ad262391c.jpg');
        }
      `}</style>
      <div className="space-y-4">
        {/* Notifications - On top */}
        <div className="space-y-3">
          {/* Closed Notification */}
          <div>
            {selectedOS === 'ios' ? (
              <IOSNotificationClosedPreview templateData={templateData} variableValues={variableValues} />
            ) : (
              <AndroidNotificationClosedPreview templateData={templateData} variableValues={variableValues} />
            )}
          </div>

          {/* Open Notification */}
          <div>
            {selectedOS === 'ios' ? (
              <IOSNotificationPreview templateData={templateData} variableValues={variableValues} />
            ) : (
              <AndroidNotificationPreview templateData={templateData} variableValues={variableValues} />
            )}
          </div>
        </div>

        {/* Chat Preview - Below notifications, wider and taller */}
        <div>
          {selectedOS === 'ios' ? (
          // iOS Chat Preview (existing iPhone frame)
          <div className="mx-auto max-w-[400px]">
            {/* iPhone Container with rounded corners and notch */}
            <div className="bg-black dark:bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Dynamic Island / Notch */}
                <div className="relative bg-black dark:bg-gray-900 rounded-[2.25rem] overflow-hidden">
                  {/* Dynamic Island - Pill Shape (Smaller & Thinner) - Aligned with status bar */}
                  <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-20 h-5 bg-black dark:bg-black rounded-full z-20 shadow-lg"></div>

                  {/* Screen Content */}
                  <div className="bg-white dark:bg-gray-950 rounded-[2rem] overflow-hidden">
                    {/* iOS Status Bar with translucent background */}
                    <div className="bg-[#F5F2EB] dark:bg-gray-950 backdrop-blur-xl px-3 pt-3 pb-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-black dark:text-white ml-1">9:41</span>
                        <div className="flex items-center gap-1 mr-1">
                          {/* Cellular Signal - Smaller */}
                          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-black dark:text-white">
                            <rect x="0" y="7" width="2.5" height="4" rx="0.5" fill="currentColor"/>
                            <rect x="4" y="5.5" width="2.5" height="5.5" rx="0.5" fill="currentColor"/>
                            <rect x="8" y="3.5" width="2.5" height="7.5" rx="0.5" fill="currentColor"/>
                            <rect x="12" y="0" width="2.5" height="11" rx="0.5" fill="currentColor"/>
                          </svg>
                          {/* WiFi - Smaller */}
                          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-black dark:text-white">
                            <path d="M7.5 11C8.05 11 8.5 10.55 8.5 10C8.5 9.45 8.05 9 7.5 9C6.95 9 6.5 9.45 6.5 10C6.5 10.55 6.95 11 7.5 11Z" fill="currentColor"/>
                            <path d="M7.5 6.5C8.6 6.5 9.6 7 10.2 7.8C10.3 8 10.6 8 10.8 7.9C11 7.8 11 7.5 10.9 7.3C10.1 6.2 8.9 5.5 7.5 5.5C6.1 5.5 4.9 6.2 4.1 7.3C4 7.5 4 7.8 4.2 7.9C4.4 8 4.7 8 4.8 7.8C5.4 7 6.4 6.5 7.5 6.5Z" fill="currentColor"/>
                            <path d="M7.5 3C9.5 3 11.3 3.9 12.5 5.5C12.6 5.7 12.9 5.7 13.1 5.6C13.3 5.5 13.3 5.2 13.2 5C11.8 3.2 9.8 2 7.5 2C5.2 2 3.2 3.2 1.8 5C1.7 5.2 1.7 5.5 1.9 5.6C2.1 5.7 2.4 5.7 2.5 5.5C3.7 3.9 5.5 3 7.5 3Z" fill="currentColor"/>
                          </svg>
                          {/* Battery - Smaller */}
                          <svg width="22" height="11" viewBox="0 0 22 11" fill="none" className="text-black dark:text-white">
                            <rect x="0.5" y="2" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                            <rect x="1.5" y="3" width="16" height="5" rx="1.5" fill="currentColor"/>
                            <path d="M20 4C20 3.72386 20.2239 3.5 20.5 3.5H21C21.2761 3.5 21.5 3.72386 21.5 4V7C21.5 7.27614 21.2761 7.5 21 7.5H20.5C20.2239 7.5 20 7.27614 20 7V4Z" fill="currentColor" opacity="0.4"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Header - iOS Style - Same translucent background */}
                    <div className="bg-[#F5F2EB] dark:bg-gray-950 backdrop-blur-xl px-2 py-2">
                      <div className="flex items-center gap-2">
                        {/* Back Button */}
                        <button className="p-1">
                          <ChevronLeft className="h-5 w-5 text-black dark:text-white" strokeWidth={2.5} />
                        </button>

                        {/* Profile Picture - Smaller */}
                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src="https://res.cloudinary.com/dbqgbemui/image/upload/v1761873777/Samsung_Store_deken7.png"
                            alt="Samsung Store"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Contact Info - Smaller Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[12px] text-black dark:text-white truncate leading-tight">Samsung Store</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">en línea</p>
                        </div>

                        {/* Action Buttons - Black Icons */}
                        <button className="p-1">
                          <VideoIcon className="h-[15px] w-[15px] text-black dark:text-white" />
                        </button>
                        <button className="p-1">
                          <PhoneCall className="h-[15px] w-[15px] text-black dark:text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div
                      className="px-3 py-3 bg-cover bg-center whatsapp-chat-bg"
                      style={{ minHeight: "560px" }}
                    >
                      <div className="flex justify-start">
                        {/* Message Bubble - User receiving (left side, white/dark gray) */}
                        <div className="bg-white dark:bg-[#1F2C33] rounded-md shadow-sm p-2 max-w-[200px]">
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

                    {/* WhatsApp Input Bar - iOS Style */}
                    <div className="bg-[#F6F6F6] dark:bg-gray-950 px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <button className="p-0.5">
                          <Plus className="h-[18px] w-[18px] text-black dark:text-white" />
                        </button>
                        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-2.5 py-1 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-1">Mensaje</span>
                          {/* Sticker icon */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 dark:text-gray-500">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                            <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                            <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                            <path d="M8 15C8 15 9.5 17 12 17C14.5 17 16 15 16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <button className="p-0.5">
                          <Camera className="h-[18px] w-[18px] text-black dark:text-white" />
                        </button>
                        <button className="p-0.5">
                          <Mic className="h-[18px] w-[18px] text-black dark:text-white" />
                        </button>
                      </div>
                    </div>

                    {/* iOS Home Indicator */}
                    <div className="bg-[#F5F2EB] dark:bg-gray-950 flex justify-center py-2">

                    </div>
                  </div>
                </div>
              </div>
          </div>
          ) : (
            // Android Chat Preview
            <AndroidChatPreview templateData={templateData} variableValues={variableValues} />
          )}
        </div>
      </div>
    </>
  );
}
