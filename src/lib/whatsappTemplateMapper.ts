import { WhatsAppTemplate, BackendWhatsAppTemplate, ParsedComponent } from "@/types";

/**
 * Mapper para convertir templates de WhatsApp del formato del backend
 * al formato utilizado en el frontend
 */

export function mapBackendToFrontend(
  backendTemplate: BackendWhatsAppTemplate
): WhatsAppTemplate {
  try {
    // Inicializar valores por defecto
    let header: { type: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'; content: string } = {
      type: 'NONE',
      content: '',
    };
    let body = '';
    let footer = '';
    let buttons: WhatsAppTemplate['buttons'] = [];

    // Validar y parsear componentes - manejar tanto array como JSON string
    let componentesToProcess: any[] = [];
    
    // Primero intentar con components (array)
    if (backendTemplate.components && Array.isArray(backendTemplate.components)) {
      componentesToProcess = backendTemplate.components;
    }
    // Luego intentar con componentes (JSON string)
    else if (backendTemplate.componentes && typeof backendTemplate.componentes === 'string') {
      try {
        componentesToProcess = JSON.parse(backendTemplate.componentes);
      } catch (parseError) {
        console.error('Error parsing componentes JSON:', parseError, 'Componentes:', backendTemplate.componentes);
      }
    }
    
    // Procesar cada componente
    if (componentesToProcess.length > 0) {
      componentesToProcess.forEach((component: any) => {
        switch (component.type) {
          case 'HEADER':
            if (component.format && ['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(component.format)) {
              // Media header: extract URL from example.header_handle or header_url
              const mediaUrl =
                component.example?.header_handle?.[0] ||
                component.example?.header_url?.[0] ||
                '';
              header = {
                type: component.format as 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION',
                content: mediaUrl,
              };
            } else {
              header = {
                type: component.text ? 'TEXT' : 'NONE',
                content: component.text || '',
              };
            }
            break;
          case 'BODY':
            body = component.text || '';
            break;
          case 'FOOTER':
            footer = component.text || '';
            break;
          case 'BUTTONS':
            if (component.buttons) {
              buttons = component.buttons.map((btn: any, index: number) => ({
                id: index + 1,
                type: btn.type,
                text: btn.text,
                ...(btn.type === 'PHONE_NUMBER' && { phoneNumber: btn.phoneNumber || '' }),
                ...(btn.type === 'URL' && { url: btn.url || '' }),
              }));
            }
            break;
        }
      });
    }

    // Mapear estado
    const estadoValue = backendTemplate.status;
    const estado = estadoValue ? estadoValue.toLowerCase() : 'pending';
    const statusMap: Record<string, 'active' | 'inactive' | 'pending' | 'rejected'> = {
      'approved': 'active',
      'pending': 'pending',
      'rejected': 'rejected',
      'inactive': 'inactive',
      // Agregar más mapeos para cubrir todos los casos de la BD
      'active': 'active',
      'draft': 'pending',
    };
    const status = statusMap[estado] || 'pending';

    // Calcular métricas con validaciones
    const sent = backendTemplate.mensajes_enviados ?? 0;
    const delivered = backendTemplate.mensajes_entregados ?? 0;
    const read = backendTemplate.mensajes_leidos ?? 0;
    const clicks = backendTemplate.clics_enlaces ?? 0;
    const openRate = sent > 0 ? (read / sent) * 100 : 0;
    const ctr = delivered > 0 ? (clicks / delivered) * 100 : 0;
    const conversionRate = clicks > 0 ? (clicks / clicks) * 100 : 0; // TODO: update with real conversions

    const mapped = {
      id: backendTemplate.id ?? '',
      name: backendTemplate.name ?? '',
      category: backendTemplate.category ?? 'MARKETING',
      language: backendTemplate.language ?? 'es',
      status,
      header,
      body,
      footer,
      buttons,
      variables: backendTemplate.variables ?? [],
      metrics: {
        sent,
        delivered,
        read,
        clicks,
        conversions: 0, // TODO: add when available from backend
        openRate: Number(openRate.toFixed(1)),
        ctr: Number(ctr.toFixed(1)),
        conversionRate: Number(conversionRate.toFixed(1)),
      },
      lastUsed: backendTemplate.fecha_ultimo_uso
        ? new Date(backendTemplate.fecha_ultimo_uso)
        : undefined,
      createdAt: backendTemplate.fecha_creacion ? new Date(backendTemplate.fecha_creacion) : new Date(),
      updatedAt: backendTemplate.fecha_actualizacion ? new Date(backendTemplate.fecha_actualizacion) : new Date(),
    };
    
    return mapped;
  } catch (error) {
    console.error('Error mapping WhatsApp template:', error);
    // Return a default template in case of error
    return {
      id: backendTemplate.id ?? '',
      name: backendTemplate.name ?? '',
      category: backendTemplate.category ?? 'MARKETING',
      language: backendTemplate.language ?? 'es',
      status: 'pending' as const,
      header: { type: 'NONE' as const, content: '' },
      body: '',
      footer: '',
      buttons: [],
      variables: backendTemplate.variables ?? [],
      metrics: {
        sent: 0,
        delivered: 0,
        read: 0,
        clicks: 0,
        conversions: 0,
        openRate: 0,
        ctr: 0,
        conversionRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export function mapBackendArrayToFrontend(
  backendTemplates: BackendWhatsAppTemplate[]
): WhatsAppTemplate[] {
  const mappedTemplates = backendTemplates.map(mapBackendToFrontend);
  
  // Eliminar duplicados basados en el nombre de la plantilla
  const uniqueTemplates = mappedTemplates.filter((template, index, self) => 
    index === self.findIndex(t => t.name === template.name)
  );
  
  return uniqueTemplates;
}

