# 🔐 Integración de API Key - Resumen de Cambios

## 📋 Resumen

Se ha implementado la autenticación mediante API Key (`X-API-Key`) en todas las peticiones HTTP al backend. La API Key se configura mediante la variable de entorno `NEXT_PUBLIC_API_KEY` y se incluye automáticamente en los headers de todas las peticiones.

---

## ✅ Archivos Modificados

### 1. **Nuevo Archivo: `src/lib/api-client.ts`**
Cliente HTTP centralizado con soporte para API Key automático.

**Funciones principales:**
- `apiClient(endpoint, options)` - Cliente base con API Key
- `apiClientFormData(endpoint, options)` - Cliente para FormData (sin Content-Type)
- `apiGet<T>(endpoint)` - Helper para GET
- `apiPost<T>(endpoint, data)` - Helper para POST
- `apiPut<T>(endpoint, data)` - Helper para PUT
- `apiPatch<T>(endpoint, data)` - Helper para PATCH
- `apiDelete<T>(endpoint)` - Helper para DELETE
- `getApiKey()` - Obtener la API Key configurada
- `isApiKeyConfigured()` - Verificar si está configurada

**Características:**
- ✅ Incluye `X-API-Key` header automáticamente en todas las peticiones
- ✅ Manejo de errores 401 (auth) y 429 (rate limit)
- ✅ Advertencia en desarrollo si no está configurada la API Key
- ✅ Soporte para JSON y FormData

---

### 2. **`src/lib/api.ts`**
Actualizado para incluir API Key en todas las peticiones.

**Cambios realizados:**
- ✅ Import de `getApiKey()` desde `api-client.ts`
- ✅ Actualizado `ApiClient.request()` para incluir `X-API-Key` header
- ✅ Actualizado `ApiClient.postFormData()` para incluir `X-API-Key` header
- ✅ Actualizado `ApiClient.putFormData()` para incluir `X-API-Key` header

**Endpoints actualizados:**
- ✅ `productEndpoints.updateImageAtPosition()`
- ✅ `productEndpoints.addImage()`
- ✅ `productEndpoints.addMultipleImages()`
- ✅ `productEndpoints.uploadMultipleData()`
- ✅ `productEndpoints.deleteDetailImages()`
- ✅ `productEndpoints.deletePreviewImage()`
- ✅ `multimediaEndpoints.createMenuImage()`
- ✅ `multimediaEndpoints.updateMenuImage()`
- ✅ `multimediaEndpoints.createCategoryImage()`
- ✅ `multimediaEndpoints.updateCategoryImage()`
- ✅ `multimediaEndpoints.createSubmenuImage()`
- ✅ `multimediaEndpoints.updateSubmenuImage()`

---

### 3. **`src/lib/api/multimedia-premium.ts`**
Actualizado para incluir API Key en operaciones multimedia premium.

**Funciones actualizadas:**
- ✅ `uploadCarouselVideos()`
- ✅ `deleteCarouselVideo()`
- ✅ `uploadCarouselImages()`
- ✅ `deleteCarouselImage()`
- ✅ `reorderCarouselImages()`
- ✅ `uploadDeviceImage()`
- ✅ `deleteDeviceImage()`
- ✅ `uploadDeviceImageForColor()`
- ✅ `deleteDeviceImageForColor()`

---

### 4. **`src/lib/api/coverage-zones.ts`**
Actualizado para incluir API Key en operaciones de zonas de cobertura.

**Cambios:**
- ✅ Import de `getApiKey()` desde `api-client.ts`
- ✅ Actualizado `fetchAPI()` helper para incluir `X-API-Key` header

---

### 5. **Next.js API Routes (Server-side)**
Actualizados para incluir API Key cuando hacen proxy al backend.

**Archivos modificados:**
- ✅ `src/app/api/products/[id]/media/route.ts` (PUT)
- ✅ `src/app/api/products/[id]/media/preview/route.ts` (DELETE)
- ✅ `src/app/api/products/[id]/media/detail/route.ts` (DELETE)

**Cambios:**
- Agregado `const API_KEY = process.env.NEXT_PUBLIC_API_KEY`
- Incluido header `X-API-Key` en fetch al backend

---

### 6. **`src/components/coverage-zones/coverage-checker.tsx`**
Actualizado para incluir API Key en búsquedas de lugares.

**Funciones actualizadas:**
- ✅ `searchPlaces()` - Autocomplete de direcciones
- ✅ `getPlaceDetails()` - Detalles de un lugar específico

---

## 🔧 Configuración Requerida

### Variable de Entorno

Agregar en **`.env.local`** (desarrollo) o en las variables de entorno del servidor (producción):

```bash
NEXT_PUBLIC_API_KEY=IMAGIQ_4fe423f679538b1d4e12685b947337a49c589d358b4154b3981d005777e9a1e0
```

### Verificación

La aplicación mostrará una advertencia en consola (solo en desarrollo) si la API Key no está configurada:

```
⚠️ NEXT_PUBLIC_API_KEY no está configurada. Las peticiones al API fallarán.
Agrega NEXT_PUBLIC_API_KEY a tu archivo .env.local
```

---

## 📝 Formato del Header

Todas las peticiones ahora incluyen el header:

```
X-API-Key: IMAGIQ_4fe423f679538b1d4e12685b947337a49c589d358b4154b3981d005777e9a1e0
```

---

## 🧪 Testing

### Verificar que la API Key se envía correctamente:

1. Abrir DevTools → Network
2. Hacer una petición (ej: crear banner, subir imagen, etc.)
3. Verificar en los Request Headers que aparece:
   ```
   X-API-Key: IMAGIQ_4fe423f679538b1d4e12685b947337a49c589d358b4154b3981d005777e9a1e0
   ```

### Verificar manejo de errores:

```javascript
// En consola del navegador
const response = await fetch('/api/multimedia/banners', {
  method: 'GET'
})
// Sin API Key, debería retornar 401 Unauthorized
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas:
- La API Key se lee de variable de entorno (no hardcodeada)
- Solo se incluye si está configurada (`...(apiKey && { 'X-API-Key': apiKey })`)
- Warnings claros en desarrollo si falta la configuración
- Manejo de errores 401 y 429 específicos

### ⚠️ Consideraciones:
- `NEXT_PUBLIC_*` variables son accesibles en el cliente (navegador)
- Para seguridad adicional, considerar:
  - Usar API routes de Next.js como proxy (ya implementado en `/api/products/*`)
  - Implementar autenticación JWT para usuarios
  - Rate limiting en el backend

---

## 📚 Uso de los Helpers

### Ejemplo con JSON:

```typescript
import { apiGet, apiPost } from '@/lib/api-client'

// GET
const products = await apiGet<Product[]>('/api/products')

// POST
const newOrder = await apiPost<Order>('/api/orders', { 
  items: [...] 
})
```

### Ejemplo con FormData:

```typescript
import { apiClientFormData } from '@/lib/api-client'

const formData = new FormData()
formData.append('file', imageFile)
formData.append('name', 'Banner Hero')

const response = await apiClientFormData('/api/multimedia/banners', {
  method: 'POST',
  body: formData
})

const data = await response.json()
```

---

## 🐛 Troubleshooting

### Error 401 Unauthorized

**Causa:** API Key inválida o faltante

**Solución:**
1. Verificar que existe `.env.local` con `NEXT_PUBLIC_API_KEY`
2. Reiniciar el servidor de desarrollo (`npm run dev`)
3. Verificar que el valor coincide con el backend

### Error 429 Too Many Requests

**Causa:** Demasiadas peticiones (rate limit excedido)

**Solución:**
- Esperar unos segundos antes de reintentar
- Implementar debouncing en búsquedas/autocomplete
- Contactar backend para aumentar límites si es necesario

### Peticiones sin API Key

**Síntoma:** Consola muestra warning pero las peticiones fallan con 401

**Solución:**
1. Verificar que la variable empieza con `NEXT_PUBLIC_`
2. Reiniciar completamente el servidor
3. Verificar que no hay typos en el nombre de la variable

---

## 📞 Soporte

Si encuentras problemas con la integración de API Key:

1. Verificar que todos los archivos listados arriba fueron actualizados correctamente
2. Verificar que la variable de entorno está configurada
3. Revisar la consola del navegador para warnings/errores específicos
4. Verificar los Request Headers en DevTools → Network

---

**Última actualización:** Enero 2025
**Autor:** Equipo de Desarrollo
