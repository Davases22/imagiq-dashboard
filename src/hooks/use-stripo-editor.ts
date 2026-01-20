"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { stripoEndpoints, EmailTemplate } from "@/lib/api";

interface StripoEditorState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  token: string | null;
}

interface StripoEditorCallbacks {
  onTemplateLoaded?: () => void;
  onTemplateSaved?: (template: EmailTemplate) => void;
  onError?: (error: string) => void;
}

// Hook to keep callbacks stable
function useCallbackRef<T extends (...args: unknown[]) => unknown>(
  callback: T | undefined
): React.MutableRefObject<T | undefined> {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }, [callback]);
  return ref;
}

declare global {
  interface Window {
    UIEditor: {
      initEditor: (container: HTMLElement, config: StripoConfig) => void;
    };
    StripoEditorApi: {
      actionsApi: {
        getTemplateData: (callback: (data: { html: string; css: string }) => void) => void;
        compileEmail: (options: { callback: (error: string | null, html: string, ampHtml: string, ampErrors: unknown) => void }) => void;
        save: (callback: (error: string | null) => void) => void;
      };
      stop: () => void;
    };
  }
}

interface StripoAuthData {
  pluginId: string;
  secretKey: string;
  userId: string;
  role: string;
  emailId?: string;
}

interface StripoConfig {
  html: string;
  css: string;
  locale?: string;
  metadata?: {
    emailId: string;
    userId?: string;
    username?: string;
  };
  onTokenRefreshRequest: (callback: (token: string) => void) => void;
  getAuthData: (callback: (authData: StripoAuthData) => void) => void;
  onTemplateLoaded?: () => void;
  onTemplateChanged?: () => void;
  codeEditorButtonSelector?: string;
  undoButtonSelector?: string;
  redoButtonSelector?: string;
  notifications?: {
    info?: (message: string, id?: string) => void;
    error?: (message: string, id?: string) => void;
    warn?: (message: string, id?: string) => void;
    success?: (message: string, id?: string) => void;
    loader?: (message: string, id?: string) => void;
    hide?: (id: string) => void;
  };
  // Enable template library features
  enableXSSSecurity?: boolean;
  mergeTags?: Array<{ category: string; entries: Array<{ label: string; value: string }> }>;
}

export function useStripoEditor(callbacks?: StripoEditorCallbacks) {
  const [state, setState] = useState<StripoEditorState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    token: null,
  });

  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  // Use refs for callbacks to avoid dependency changes
  const onTemplateLoadedRef = useCallbackRef(callbacks?.onTemplateLoaded);
  const onTemplateSavedRef = useCallbackRef(callbacks?.onTemplateSaved);
  const onErrorRef = useCallbackRef(callbacks?.onError);

  // Load Stripo scripts dynamically - returns a promise that resolves when script is loaded
  // The actual initialization happens in initializeEditor after script loads
  const loadStripoScripts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (scriptLoadedRef.current && window.UIEditor) {
        resolve();
        return;
      }

      // Script element exists, wait for UIEditor
      const existingScript = document.getElementById("UiEditorScript");
      if (existingScript) {
        // If UIEditor already available, resolve
        if (window.UIEditor) {
          scriptLoadedRef.current = true;
          resolve();
          return;
        }
        // Otherwise wait for it via onload
        existingScript.addEventListener("load", () => {
          scriptLoadedRef.current = true;
          resolve();
        });
        return;
      }

      // Create and load script (following official example pattern)
      const script = document.createElement("script");
      script.id = "UiEditorScript";
      script.type = "module";
      script.src = "https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js";

      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load Stripo scripts"));
      };

      document.body.appendChild(script);
    });
  }, []);

  // Get authentication token from backend
  const getToken = useCallback(async (emailId?: string): Promise<string> => {
    const response = await stripoEndpoints.getToken(emailId);
    console.log("getToken response:", response);

    // The API client wraps the response in { data: T, success: boolean }
    // So the token is at response.data.token
    if (!response.success) {
      throw new Error(response.message || "Error al obtener token de Stripo");
    }

    const token = response.data?.token;
    if (!token) {
      console.error("Token not found in response:", response);
      throw new Error("Token no encontrado en la respuesta del servidor");
    }

    return token;
  }, []);

  // Get auth data for template library access
  const fetchAuthData = useCallback(async (): Promise<StripoAuthData> => {
    const response = await stripoEndpoints.getAuthData();
    console.log("getAuthData response:", response);

    if (!response.success) {
      throw new Error(response.message || "Error al obtener datos de autenticación de Stripo");
    }

    return response.data as StripoAuthData;
  }, []);

  // Initialize Stripo editor
  const initializeEditor = useCallback(
    async (
      containerId: string,
      options?: {
        templateId?: string;
        html?: string;
        css?: string;
      }
    ) => {
      if (initializedRef.current) {
        return;
      }

      // Mark as initialized immediately to prevent re-entry
      initializedRef.current = true;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Load scripts first
        await loadStripoScripts();

        // Wait for UIEditor to be available on window (module initialization)
        let attempts = 0;
        while (!window.UIEditor && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.UIEditor) {
          throw new Error("UIEditor not available after script load");
        }

        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`Container element #${containerId} not found`);
        }

        // Log options to debug
        console.log("initializeEditor options:", {
          hasHtml: !!options?.html,
          htmlLength: options?.html?.length,
          hasCss: !!options?.css,
        });

        // Default empty template if none provided
        const templateHtml = options?.html || `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div class="es-wrapper-color">
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td class="esd-email-paddings" valign="top">
          <table class="es-content" cellspacing="0" cellpadding="0" align="center">
            <tr>
              <td class="esd-stripe" align="center">
                <table class="es-content-body" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                  <tr>
                    <td class="esd-structure es-p20" align="left">
                      <table width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td class="esd-container-frame" width="560" valign="top" align="center">
                            <table width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td class="esd-block-text es-p10" align="center">
                                  <h1>Tu contenido aquí</h1>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

        const config: StripoConfig = {
          html: templateHtml,
          css: options?.css || "",
          locale: "es",
          metadata: {
            emailId: options?.templateId || `new-email-${Date.now()}`,
          },
          onTokenRefreshRequest: async (callback) => {
            try {
              console.log("Stripo requesting token refresh...");
              const token = await getToken(options?.templateId);
              console.log("Token received, first 50 chars:", token.substring(0, 50));
              callback(token);
            } catch (error) {
              console.error("Error getting Stripo token:", error);
              onErrorRef.current?.("Error al obtener token de autenticación");
            }
          },
          getAuthData: async (callback) => {
            try {
              console.log("Stripo requesting auth data for template library...");
              const authData = await fetchAuthData();
              console.log("Auth data received, pluginId starts with:", authData.pluginId.substring(0, 8));
              callback(authData);
            } catch (error) {
              console.error("Error getting Stripo auth data:", error);
              onErrorRef.current?.("Error al obtener datos de autenticación");
            }
          },
          onTemplateLoaded: () => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isInitialized: true,
            }));
            onTemplateLoadedRef.current?.();
          },
          notifications: {
            info: (message: string) => console.log("Stripo info:", message),
            error: (message: string) => console.error("Stripo error:", message),
            warn: (message: string) => console.warn("Stripo warn:", message),
            success: (message: string) => console.log("Stripo success:", message),
            loader: (message: string) => console.log("Stripo loader:", message),
            hide: () => {},
          },
        };

        // Initialize Stripo with UIEditor
        window.UIEditor.initEditor(container, config);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al inicializar editor";
        // Reset initialized ref so user can retry
        initializedRef.current = false;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        onErrorRef.current?.(errorMessage);
      }
    },
    [loadStripoScripts, getToken, fetchAuthData]
  );

  // Get compiled HTML from editor
  const getCompiledEmail = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.StripoEditorApi) {
        reject(new Error("Stripo API not available"));
        return;
      }

      window.StripoEditorApi.actionsApi.compileEmail({
        callback: (error, html) => {
          if (error) {
            reject(new Error(error));
          } else {
            resolve(html);
          }
        },
      });
    });
  }, []);

  // Get template data (HTML + CSS) for saving
  const getTemplateData = useCallback((): Promise<{ html: string; css: string }> => {
    return new Promise((resolve, reject) => {
      if (!window.StripoEditorApi) {
        reject(new Error("Stripo API not available"));
        return;
      }

      window.StripoEditorApi.actionsApi.getTemplateData((data) => {
        resolve(data);
      });
    });
  }, []);

  // Save template to backend
  const saveTemplate = useCallback(
    async (
      name: string,
      subject: string,
      options?: {
        description?: string;
        category?: string;
        status?: string;
      }
    ): Promise<EmailTemplate> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [compiledHtml, templateData] = await Promise.all([
          getCompiledEmail(),
          getTemplateData(),
        ]);

        const template = await stripoEndpoints.saveTemplate({
          name,
          subject,
          htmlContent: compiledHtml,
          designJson: { html: templateData.html, css: templateData.css },
          ...options,
        });

        setState((prev) => ({ ...prev, isLoading: false }));
        onTemplateSavedRef.current?.(template);
        return template;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al guardar template";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [getCompiledEmail, getTemplateData]
  );

  // Update existing template
  const updateTemplate = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        subject?: string;
        description?: string;
        category?: string;
        status?: string;
      }
    ): Promise<EmailTemplate> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [compiledHtml, templateData] = await Promise.all([
          getCompiledEmail(),
          getTemplateData(),
        ]);

        const template = await stripoEndpoints.updateTemplate(id, {
          ...data,
          htmlContent: compiledHtml,
          designJson: { html: templateData.html, css: templateData.css },
        });

        setState((prev) => ({ ...prev, isLoading: false }));
        onTemplateSavedRef.current?.(template);
        return template;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al actualizar template";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [getCompiledEmail, getTemplateData]
  );

  // Reset and reinitialize editor with new content
  const resetAndReinitialize = useCallback(
    async (
      containerId: string,
      options?: {
        templateId?: string;
        html?: string;
        css?: string;
      }
    ) => {
      // Stop existing editor
      if (window.StripoEditorApi && initializedRef.current) {
        try {
          window.StripoEditorApi.stop();
        } catch {
          // Ignore cleanup errors
        }
      }

      // Reset state
      initializedRef.current = false;
      setState((prev) => ({
        ...prev,
        isInitialized: false,
        isLoading: true,
        error: null,
      }));

      // Clear the container DOM to ensure clean state
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }

      // Longer delay to ensure Stripo cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Reinitialize with new content
      await initializeEditor(containerId, options);
    },
    [initializeEditor]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.StripoEditorApi && initializedRef.current) {
        try {
          window.StripoEditorApi.stop();
        } catch {
          // Ignore cleanup errors
        }
        initializedRef.current = false;
      }
    };
  }, []);

  return {
    ...state,
    initializeEditor,
    resetAndReinitialize,
    getCompiledEmail,
    getTemplateData,
    saveTemplate,
    updateTemplate,
  };
}
