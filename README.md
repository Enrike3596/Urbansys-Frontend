# UrbanSys - Frontend

Interfaz de usuario para el sistema de gestión de conjuntos residenciales. Construida con **Vue 3** y **Vite**, consumiendo la API REST del backend de UrbanSys.

## Tecnologías

- **Vue 3** — Framework progresivo para la interfaz de usuario
- **Vite 7** — Bundler y servidor de desarrollo
- **Pinia** — Manejo de estado global
- **Vue Router 5** — Enrutamiento del lado cliente
- **SweetAlert2** — Notificaciones y diálogos
- **xlsx** — Procesamiento de archivos Excel
- **ESLint + Oxlint + Prettier** — Linting y formato de código

## Estructura del proyecto

```
src/
├── assets/        — Recursos estáticos (imágenes, estilos)
├── components/    — Componentes reutilizables
├── composables/   — Funciones compostables (Composition API)
├── layouts/       — Layouts de página
├── router/        — Configuración de rutas
├── services/      — Llamadas a la API REST
├── stores/        — Stores de Pinia
├── utils/         — Utilidades
├── views/         — Vistas/páginas de la aplicación
│   ├── Admin/     — Panel de administración
│   ├── Auth/      — Autenticación (login, registro)
│   └── Dashboard/ — Panel principal del usuario
├── App.vue        — Componente raíz
└── main.js        — Punto de entrada
```

## Requisitos

- **Node.js** 20.19+ o 22.12+
- **npm** 10+

## Instalación y ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

El servidor de desarrollo se iniciará en `http://localhost:5173`.

### 3. Compilar para producción

```bash
npm run build
```

Los archivos generados se ubicarán en el directorio `dist/`.

### 4. Vista previa de la compilación

```bash
npm run preview
```

### 5. Linting y formato

```bash
npm run lint
npm run format
```

## Configuración

La conexión con el backend se configura a través de variables de entorno o archivos de servicio en `src/services/`. Por defecto, apunta a `http://localhost:8080/api/`.
