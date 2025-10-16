// WebRTC utility functions and configurations

import { ICECandidate, WebRTCOffer, WebRTCAnswer } from '../types';

export const webrtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export const mediaConstraints: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};

export class WebRTCManager {
  static async getUserMedia(constraints: MediaStreamConstraints = mediaConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error(`Failed to access media devices: ${error}`);
    }
  }

  static async getScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      return stream;
    } catch (error) {
      console.error('Error accessing screen share:', error);
      throw new Error(`Failed to access screen share: ${error}`);
    }
  }

  static createPeerConnection(config: RTCConfiguration = webrtcConfig): RTCPeerConnection {
    return new RTCPeerConnection(config);
  }

  static async createOffer(peerConnection: RTCPeerConnection): Promise<WebRTCOffer> {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      return {
        type: 'offer',
        sdp: offer.sdp!,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error creating offer:', error);
      throw new Error(`Failed to create offer: ${error}`);
    }
  }

  static async createAnswer(peerConnection: RTCPeerConnection): Promise<WebRTCAnswer> {
    try {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      return {
        type: 'answer',
        sdp: answer.sdp!,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error creating answer:', error);
      throw new Error(`Failed to create answer: ${error}`);
    }
  }

  static async setRemoteDescription(
    peerConnection: RTCPeerConnection,
    description: WebRTCOffer | WebRTCAnswer
  ): Promise<void> {
    try {
      await peerConnection.setRemoteDescription({
        type: description.type,
        sdp: description.sdp,
      });
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw new Error(`Failed to set remote description: ${error}`);
    }
  }

  static async addIceCandidate(
    peerConnection: RTCPeerConnection,
    candidate: ICECandidate
  ): Promise<void> {
    try {
      await peerConnection.addIceCandidate({
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      });
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw new Error(`Failed to add ICE candidate: ${error}`);
    }
  }

  static addStreamToPeerConnection(peerConnection: RTCPeerConnection, stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  }

  static removeStreamFromPeerConnection(peerConnection: RTCPeerConnection, stream: MediaStream): void {
    const senders = peerConnection.getSenders();
    stream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track === track);
      if (sender) {
        peerConnection.removeTrack(sender);
      }
    });
  }

  static stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }

  static toggleTrack(stream: MediaStream, kind: 'audio' | 'video', enabled: boolean): void {
    const tracks = stream.getTracks().filter(track => track.kind === kind);
    tracks.forEach(track => {
      track.enabled = enabled;
    });
  }

  static getConnectionStateString(state: RTCPeerConnectionState): string {
    switch (state) {
      case 'new':
        return 'Initializing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection Failed';
      case 'closed':
        return 'Connection Closed';
      default:
        return 'Unknown';
    }
  }

  static isVideoEnabled(stream: MediaStream): boolean {
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].enabled;
  }

  static isAudioEnabled(stream: MediaStream): boolean {
    const audioTracks = stream.getAudioTracks();
    return audioTracks.length > 0 && audioTracks[0].enabled;
  }
}

export default WebRTCManager;