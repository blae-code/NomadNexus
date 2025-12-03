// Temporary stub for audio processing to satisfy imports. Replace with real spatial audio processor if needed.
class AudioProcessor {
  static instance = null;
  static getInstance() {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor();
    }
    return AudioProcessor.instance;
  }
  processRemoteTrack() {}
  updatePanAndGain() {}
}

export default AudioProcessor;
