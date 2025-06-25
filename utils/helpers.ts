export const generateUniqueId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Function to simulate processing tasks based on message content
export const processMessage = async (content: string, type: 'text' | 'audio'): Promise<string> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lowerContent = content.toLowerCase();
  
  // Simple keyword-based responses - here you can add your AI/task processing logic
  if (lowerContent.includes('hola') || lowerContent.includes('hello')) {
    return '¡Hola! Es un placer saludarte. ¿En qué puedo ayudarte hoy?';
  }
  
  if (lowerContent.includes('tiempo') || lowerContent.includes('clima')) {
    return 'Para consultar el clima, necesitaría integrar un servicio meteorológico. ¿Te gustaría que implemente esa funcionalidad?';
  }
  
  if (lowerContent.includes('ayuda') || lowerContent.includes('help')) {
    return 'Estoy aquí para ayudarte. Puedes enviarme mensajes de texto o grabaciones de audio. Pronto tendré más funcionalidades disponibles.';
  }
  
  if (lowerContent.includes('gracias') || lowerContent.includes('thanks')) {
    return '¡De nada! Siempre es un placer ayudarte. ¿Hay algo más en lo que pueda asistirte?';
  }
  
  if (type === 'audio') {
    return 'He recibido tu mensaje de audio. En el futuro podré transcribir y procesar el contenido de audio. ¿Hay algo específico que te gustaría que haga?';
  }
  
  // Default responses
  const defaultResponses = [
    'Interesante mensaje. He procesado tu información correctamente.',
    'Entiendo lo que me dices. ¿Hay algo específico en lo que pueda ayudarte?',
    'Gracias por tu mensaje. Estoy aquí para asistirte en lo que necesites.',
    'He recibido tu mensaje. ¿Te gustaría que realice alguna tarea específica?',
    'Perfecto, he procesado tu solicitud. ¿Qué más puedo hacer por ti?',
    'Tu mensaje ha sido procesado. ¿Necesitas que ejecute alguna acción en particular?',
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}; 