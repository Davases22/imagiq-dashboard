'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLegalDocuments, type LegalDocument } from '@/hooks/use-legal-documents';
import { TiptapEditor, extractSectionsFromContent } from '@/components/legal/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Settings,
  Search,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// Función para generar slug desde título
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/^-+|-+$/g, '');
}

export default function EditarTerminosCondicionesPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const { getDocument, updateDocument } = useLegalDocuments({ autoFetch: false });

  // Estado de carga
  const [isLoading, setIsLoading] = useState(true);
  const [document, setDocument] = useState<LegalDocument | null>(null);

  // Estado del formulario
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState<any>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar documento
  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      try {
        const doc = await getDocument(documentId);
        if (doc) {
          setDocument(doc);
          setTitle(doc.title || '');
          setSlug(doc.slug || '');
          setContent(doc.legal_content || {
            type: 'doc',
            content: [{ type: 'paragraph' }],
          });
          setMetaTitle(doc.meta_title || '');
          setMetaDescription(doc.meta_description || '');
          setMetaKeywords(doc.meta_keywords || '');
          setIsPublished(doc.status === 'published' && doc.is_active);
        } else {
          toast.error('Documento no encontrado');
          router.push('/terminos-condiciones');
        }
      } catch (error) {
        toast.error('Error al cargar el documento');
        router.push('/terminos-condiciones');
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId, getDocument, router]);

  const handleSlugChange = useCallback((newSlug: string) => {
    setSlug(generateSlug(newSlug));
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

      const result = await updateDocument(documentId, {
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
        toast.success(publish ? 'Documento publicado' : 'Cambios guardados');
      }
    } catch (error) {
      toast.error('Error al guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <header className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </section>
    );
  }

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
            <h1 className="text-2xl font-semibold">Editar documento</h1>
            <p className="text-sm text-muted-foreground">
              Modifica el contenido de tu documento legal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/soporte/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver en sitio
            </a>
          </Button>
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
            Guardar
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
        <div className="lg:col-span-2 space-y-6">
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
                  onChange={(e) => setTitle(e.target.value)}
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

          <Card>
            <CardHeader>
              <CardTitle>Contenido</CardTitle>
              <CardDescription>
                Usa el editor para modificar el contenido de tu documento legal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content && (
                <TiptapEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Escribe el contenido de tu documento aquí..."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
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
              {document?.updated_at && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Última modificación:{' '}
                    {new Date(document.updated_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
              {content && extractSectionsFromContent(content).length > 0 ? (
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
