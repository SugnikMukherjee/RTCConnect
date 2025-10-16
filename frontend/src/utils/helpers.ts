// General utility functions for the video chat application

export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const validateRoomId = (roomId: string): boolean => {
  return !!(roomId && 
         typeof roomId === 'string' && 
         roomId.length >= 3 && 
         roomId.length <= 50 &&
         /^[a-zA-Z0-9-_]+$/.test(roomId));
};

export const validateUserId = (userId: string): boolean => {
  return !!(userId && 
         typeof userId === 'string' && 
         userId.length >= 2 && 
         userId.length <= 30 &&
         /^[a-zA-Z0-9-_\s]+$/.test(userId));
};

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 100); // Limit length
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.prepend(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const getDeviceInfo = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  } catch (error) {
    console.error('Error getting device info:', error);
    return [];
  }
};

export const checkMediaPermissions = async (): Promise<{
  camera: boolean;
  microphone: boolean;
}> => {
  const result = { camera: false, microphone: false };

  try {
    // Check camera permission
    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    result.camera = cameraPermission.state === 'granted';
  } catch (error) {
    console.log('Camera permission check not supported');
  }

  try {
    // Check microphone permission
    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    result.microphone = micPermission.state === 'granted';
  } catch (error) {
    console.log('Microphone permission check not supported');
  }

  return result;
};

export const isWebRTCSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    window.RTCPeerConnection &&
    window.RTCSessionDescription &&
    window.RTCIceCandidate
  );
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// Local storage helpers
export const storage = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue ?? null);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue ?? null;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Constants
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'video_chat_user_preferences',
  LAST_USER_ID: 'video_chat_last_user_id',
  RECENT_ROOMS: 'video_chat_recent_rooms',
} as const;

export const CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
} as const;

export const CALL_STATES = {
  IDLE: 'idle',
  INITIATING: 'initiating',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  FAILED: 'failed',
} as const;