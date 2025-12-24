'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLegalDocuments } from '@/hooks/use-legal-documents';
import { TiptapEditor, extractSectionsFromContent } from '@/components/legal/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Settings,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Función para generar slug desde título
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 50) // Limitar longitud
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio/final
}

export default function CrearTerminosCondicionesPage() {
  const router = useRouter();
  const { createDocument } = useLegalDocuments({ autoFetch: false });

  // Estado del formulario
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [content, setContent] = useState<any>({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Título de la sección' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Escribe aquí el contenido de tu documento...' }],
      },
    ],
  });
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generar slug cuando cambia el título
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
    // Auto-generar meta title si está vacío
    if (!metaTitle) {
      setMetaTitle(newTitle);
    }
  }, [slugManuallyEdited, metaTitle]);

  const handleSlugChange = useCallback((newSlug: string) => {
    setSlug(generateSlug(newSlug));
    setSlugManuallyEdited(true);
  }, []);

  const handleContentChange = useCallback((newContent: any) => {
    setContent(newContent);
  }, []);

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!slug.trim()) {
      toast.error('El slug es obligatorio');
      return;
    }

    setIsSaving(true);

    try {
      const sections = extractSectionsFromContent(content);

      const result = await createDocument({
        title: title.trim(),
        slug: slug.trim(),
        legal_content: content,
        legal_sections: sections,
        meta_title: metaTitle || title,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        status: publish ? 'published' : 'draft',
        is_active: publish,
        is_public: true,
      });

      if (result) {
        toast.success(publish ? 'Documento publicado' : 'Borrador guardado');
        router.push('/terminos-condiciones');
      }
    } catch (error) {
      toast.error('Error al guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/terminos-condiciones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Crear documento legal</h1>
            <p className="text-sm text-muted-foreground">
              Crea un nuevo documento de términos y condiciones.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar borrador
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Publicar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor principal */}
        <div className="lg:col-span-2">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Escribe el contenido de tu documento aquí..."
          />
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del documento *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Términos y Condiciones Bancolombia"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/soporte/</span>
                  <Input
                    id="slug"
                    placeholder="tyc-bancolombia"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL final: /soporte/{slug || 'tu-documento'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublished ? 'Publicado' : 'Borrador'}
                  </p>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO
              </CardTitle>
              <CardDescription>
                Optimiza tu documento para buscadores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta título</Label>
                <Input
                  id="metaTitle"
                  placeholder="Título para buscadores"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {metaTitle.length}/60 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta descripción</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Descripción para buscadores"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Palabras clave</Label>
                <Input
                  id="metaKeywords"
                  placeholder="terminos, condiciones, legal"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview de secciones */}
          <Card>
            <CardHeader>
              <CardTitle>Secciones detectadas</CardTitle>
              <CardDescription>
                Estas secciones aparecerán en el índice lateral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractSectionsFromContent(content).length > 0 ? (
                <ul className="space-y-1">
                  {extractSectionsFromContent(content).map((section, i) => (
                    <li
                      key={i}
                      className="text-sm"
                      style={{ paddingLeft: `${(section.level - 1) * 12}px` }}
                    >
                      <span className="text-muted-foreground">•</span> {section.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Agrega encabezados (H1, H2, H3) para generar el índice.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
