# Avagastos Talos 💰

PWA de gestión de gastos personales con OCR para escaneo de tickets y control de presupuesto mensual.

## Características ✨

- **Gestión de Gastos**: Registra y organiza tus gastos mensuales
- **OCR Integrado**: Escanea tickets y facturas automáticamente usando Google Gemini AI
- **Control de Presupuesto**: Establece un presupuesto mensual y visualiza tu progreso
- **Interfaz Intuitiva**: Diseño moderno y responsivo con Tailwind CSS
- **PWA**: Funciona offline y se puede instalar en tu dispositivo
- **Almacenamiento Local**: Todos tus datos se guardan de forma segura en IndexedDB

## Tecnologías 🛠️

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **IndexedDB (idb)** - Base de datos local
- **Tailwind CSS** - Estilos
- **Google Gemini AI** - OCR para procesamiento de tickets

## Instalación 🚀

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn

### Pasos

1. Clona el repositorio:
```bash
git clone https://github.com/foxmuler/avagastos-talos.git
cd avagastos-talos
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura tu API Key de Gemini:
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Añade tu API key:
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```
   - Obtén tu API key en: https://makersuite.google.com/app/apikey

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre tu navegador en `http://localhost:3000`

## Uso 📱

### Vista Principal (Home)
- Visualiza tu presupuesto restante del mes
- Gráfico circular que muestra el progreso
- Total gastado vs presupuesto inicial

### Agregar Gasto
1. Haz clic en el botón "+" flotante
2. Opción 1: Escanea un ticket usando la cámara (OCR automático)
3. Opción 2: Introduce el importe manualmente
4. Añade una descripción opcional
5. Guarda el gasto

### Historial
- Ve todos tus gastos organizados por mes
- Edita o elimina gastos existentes
- Filtra por fecha

### Ajustes
- Configura tu presupuesto mensual inicial
- Ajusta el umbral de confianza del OCR (0-100%)

## Estructura del Proyecto 📁

```
avagastos-talos/
├── src/
│   ├── App.tsx              # Componente principal
│   ├── types.ts             # Definiciones de tipos TypeScript
│   ├── constants.ts         # Constantes y configuración
│   ├── components/          # Componentes reutilizables
│   │   ├── CircularProgress.tsx
│   │   └── Modal.tsx
│   └── services/            # Servicios
│       ├── db.ts            # Gestión de IndexedDB
│       └── ocrService.ts    # Integración con Gemini AI
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Build para Producción 🏗️

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## Preview de Producción 👀

```bash
npm run preview
```

## Características Técnicas 🔧

### Gestión de Estado
- React Hooks (useState, useEffect, useMemo, useCallback)
- Estado local para toda la aplicación

### Almacenamiento
- IndexedDB para persistencia de datos
- Estructura normalizada con tablas para movimientos y configuración

### OCR
- Procesamiento de imágenes con Google Gemini AI
- Extracción automática de importes de tickets
- Sistema de confianza para validar resultados

### Diseño
- Responsive mobile-first
- Dark mode por defecto
- Animaciones suaves con Tailwind

## Licencia 📄

MIT License - Ver archivo [LICENSE](LICENSE) para más detalles.

## Autor ✍️

**foxmuler**

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
