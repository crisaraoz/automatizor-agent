# ChatApp - AI Assistant

Una aplicación móvil de React Native con Expo que simula un asistente inteligente similar a ChatGPT, con capacidades de texto y audio.

## ✨ Características

- 🎤 **Grabación de Audio**: Graba y envía mensajes de voz
- 💬 **Chat de Texto**: Interfaz de chat intuitiva y moderna  
- 🎨 **UI Atractiva**: Diseño inspirado en ChatGPT con animaciones fluidas
- 📱 **Multiplataforma**: Funciona en iOS y Android
- 🔊 **Reproducción de Audio**: Reproduce mensajes de audio con controles
- ⚡ **Tiempo Real**: Indicadores de escritura y animaciones en tiempo real

## 🛠️ Tecnologías Utilizadas

- **React Native** con **Expo**
- **TypeScript** para type safety
- **Expo Audio** para grabación y reproducción
- **React Native Reanimated** para animaciones
- **Expo Vector Icons** para iconografía
- **Linear Gradient** para efectos visuales

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v14 o superior)
- npm o yarn
- Expo CLI: `npm install -g @expo/cli`
- App Expo Go en tu dispositivo móvil

### Instalación

1. **Clona o navega al directorio del proyecto**:
   ```bash
   cd ChatApp
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   npm start
   # o
   expo start
   ```

4. **Escanea el código QR**:
   - Abre la app **Expo Go** en tu celular
   - Escanea el código QR que aparece en la terminal/navegador
   - La app se cargará automáticamente en tu dispositivo

## 📱 Cómo Usar

### Enviar Mensajes de Texto
1. Escribe tu mensaje en el campo de texto
2. Presiona el botón de enviar (flecha azul)
3. El asistente responderá automáticamente

### Grabar Mensajes de Audio
1. Mantén presionado el botón del micrófono
2. Habla tu mensaje
3. Suelta para enviar o desliza para cancelar
4. El audio se enviará y podrás reproducirlo tocando el botón de play

### Características de la Interfaz
- **Burbujas de Chat**: Mensajes del usuario en azul, del asistente en gris
- **Timestamps**: Hora de envío en cada mensaje
- **Indicador de Grabación**: Animación con contador de tiempo
- **Indicador de Escritura**: Puntos animados cuando el asistente está "pensando"

## 🎯 Funcionalidades Futuras

Esta es la base para implementar funcionalidades más avanzadas:

- **Integración con IA**: Conectar con OpenAI, Claude, etc.
- **Transcripción de Audio**: Convertir audio a texto automáticamente
- **Comandos por Voz**: Ejecutar tareas específicas mediante comandos
- **Historial de Chat**: Guardar conversaciones localmente
- **Temas Personalizados**: Diferentes esquemas de color
- **Compartir Mensajes**: Exportar conversaciones

## 📁 Estructura del Proyecto

```
ChatApp/
├── components/           # Componentes de React
│   ├── ChatScreen.tsx   # Pantalla principal del chat
│   ├── ChatInput.tsx    # Input de texto y audio
│   └── MessageBubble.tsx # Burbuja de mensaje individual
├── hooks/               # Custom hooks
│   └── useAudioRecorder.ts # Hook para grabación de audio
├── types/               # Tipos TypeScript
│   └── index.ts         # Definiciones de tipos
├── utils/               # Utilidades y helpers
│   └── helpers.ts       # Funciones auxiliares
└── App.tsx             # Punto de entrada de la app
```

## 🎨 Personalización

### Colores y Temas
Puedes personalizar los colores editando los estilos en cada componente:
- **Azul principal**: `#007AFF`
- **Azul oscuro**: `#0051D0`  
- **Gris claro**: `#F2F2F7`
- **Rojo para grabación**: `#FF3B30`

### Agregar Nuevas Funcionalidades
1. **Nuevos tipos de mensaje**: Edita `types/index.ts`
2. **Lógica de procesamiento**: Modifica `utils/helpers.ts`
3. **Componentes UI**: Agrega en la carpeta `components/`

## 🐛 Solución de Problemas

### Problemas Comunes

**Error de permisos de audio:**
- Asegúrate de que la app tenga permisos de micrófono
- En iOS: Configuración > Privacidad > Micrófono
- En Android: Configuración > Apps > Permisos

**La app no se carga:**
- Verifica que tengas Expo CLI instalado
- Asegúrate de estar en la misma red WiFi
- Reinicia el servidor con `expo start --clear`

**Problemas de dependencias:**
```bash
# Limpia e reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la app:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

¡Disfruta construyendo tu asistente inteligente! 🚀 # automatizor-agent
