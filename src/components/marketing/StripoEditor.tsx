'use client';

import 'zone.js'; // Required by Stripo plugin
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Add global types for Stripo
declare global {
    interface Window {
        StripoEditorApi: any;
        UIEditor: any;
    }
}

interface StripoEditorProps {
    initialHtml?: string;
    initialCss?: string;
    emailId?: string;
    onSave?: (html: string, css: string) => void;
    onLoadTemplate?: () => void; // Callback to open template selector
}

export default function StripoEditor({
    initialHtml = '',
    initialCss = '',
    emailId = 'new-email-template',
    onSave,
    onLoadTemplate,
}: StripoEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const editorInitializedRef = useRef(false);

    // Use API Gateway URL (supports both localhost and devtunnels)
    const backendUrl = typeof window !== 'undefined'
        ? window.location.hostname.includes('devtunnels.ms')
            ? window.location.origin.replace('-3010', '-3001')
            : window.location.origin.replace(/:\d+/, ':3001')
        : 'http://localhost:3001';

    // Function to get auth token
    const getAuthToken = async () => {
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        };

        const response = await fetch(`${backendUrl}/api/messaging/email-templates/auth-token`, {
            headers
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    };

    // Initialize editor
    useEffect(() => {
        if (!isScriptLoaded || !containerRef.current || editorInitializedRef.current) {
            return;
        }

        if (!window.UIEditor) {
            console.log('UIEditor not loaded yet');
            return;
        }

        const initEditor = async () => {
            try {
                console.log('🚀 Initializing Stripo Editor...');

                // Get initial token data
                const tokenData = await getAuthToken();
                console.log('✅ Token received:', tokenData.token.substring(0, 20) + '...');

                // Mark as initialized BEFORE calling initEditor to prevent double init
                editorInitializedRef.current = true;

                // Load demo template if no initial content
                let html = initialHtml;
                let css = initialCss;

                if (!html || !css) {
                    console.log('📄 Loading demo template...');
                    try {
                        const htmlResponse = await fetch('https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.html');
                        const cssResponse = await fetch('https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.css');

                        if (htmlResponse.ok && cssResponse.ok) {
                            html = await htmlResponse.text();
                            css = await cssResponse.text();
                            console.log('✅ Demo template loaded');
                        }
                    } catch (err) {
                        console.warn('Could not load demo template, using empty template');
                    }
                }

                // Initialize the editor with correct configuration
                window.UIEditor.initEditor(
                    containerRef.current!,
                    {
                        html: html,
                        css: css,
                        metadata: {
                            emailId: emailId,
                            userId: '1',
                            username: 'User',
                        },
                        locale: 'es',
                        settingsId: process.env.NEXT_PUBLIC_STRIPO_SETTINGS_ID || 'default',
                        onTokenRefreshRequest: function (callback: (token: string) => void) {
                            console.log('🔄 Token refresh requested...');
                            getAuthToken()
                                .then(data => {
                                    console.log('✅ Token refreshed');
                                    callback(data.token);
                                })
                                .catch(err => {
                                    console.error('❌ Token refresh failed:', err);
                                });
                        },
                        notifications: {
                            info: (text: string) => console.log('[Stripo Info]', text),
                            error: (text: string) => console.error('[Stripo Error]', text),
                            warn: (text: string) => console.warn('[Stripo Warning]', text),
                            success: (text: string) => console.log('[Stripo Success]', text),
                            loader: (text: string) => console.log('[Stripo Loading]', text),
                            hide: (id: string) => console.log('[Stripo Hide]', id),
                        }
                    }
                );

                console.log('✅ Stripo Editor initialized successfully');
                setIsEditorReady(true);
                setError(null);
            } catch (err: any) {
                console.error('❌ Failed to initialize Stripo Editor:', err);
                setError(err.message || 'Failed to initialize editor');
                editorInitializedRef.current = false; // Allow retry
            }
        };

        initEditor();
    }, [isScriptLoaded, backendUrl, initialHtml, initialCss, emailId]);

    const handleSave = () => {
        if (!window.StripoEditorApi) {
            console.error('StripoEditorApi not available');
            return;
        }

        window.StripoEditorApi.actionsApi.getTemplateData((data: { html: string; css: string }) => {
            console.log('📦 Template data retrieved');
            if (onSave) {
                onSave(data.html, data.css);
            }
        });
    };

    const handleCompile = () => {
        if (!window.StripoEditorApi) {
            console.error('StripoEditorApi not available');
            return;
        }

        window.StripoEditorApi.actionsApi.compileEmail({
            callback: function (error: any, html: string) {
                if (error) {
                    console.error('Compile error:', error);
                    return;
                }
                console.log('📧 Compiled HTML ready for sending');
                console.log(html);
            }
        });
    };

    return (
        <div className="flex flex-col h-full w-full min-h-[600px] border rounded-md overflow-hidden bg-white">
            {/* Load Stripo Script */}
            <Script
                id="stripo-ui-editor"
                src="https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js"
                onLoad={() => {
                    console.log('✅ Stripo script loaded');
                    setIsScriptLoaded(true);
                }}
                onError={(e) => {
                    console.error('❌ Failed to load Stripo script:', e);
                    setError('Failed to load Stripo editor script');
                }}
            />

            {/* Toolbar / Actions */}
            <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
                <span className="font-semibold text-gray-700 ml-2">Editor Visual</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!isEditorReady}
                        className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Guardar Diseño
                    </button>
                    <button
                        onClick={handleCompile}
                        disabled={!isEditorReady}
                        className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Compilar Email
                    </button>
                </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 relative bg-gray-50">
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-4 z-10">
                        <div className="text-lg font-semibold mb-2">Error al inicializar el editor</div>
                        <div className="text-sm">{error}</div>
                        <button
                            onClick={() => {
                                setError(null);
                                editorInitializedRef.current = false;
                                window.location.reload();
                            }}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {!isEditorReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-gray-600">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <div>Cargando editor visual...</div>
                        </div>
                    </div>
                )}
                <div
                    ref={containerRef}
                    id="stripoEditorContainer"
                    className="h-full w-full"
                    style={{ minHeight: '600px' }}
                />
            </div>
        </div>
    );
}
