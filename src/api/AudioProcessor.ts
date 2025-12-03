import { RemoteTrack, Track } from 'livekit-client';

type Profile = { distortion?: number; highPass?: number; lowPass?: number; compression?: boolean };

class AudioProcessor {
  private static instance: AudioProcessor;
  private audioContext: AudioContext;
  private trackProcessors: Map<string, { source: MediaStreamAudioSourceNode; compressor: DynamicsCompressorNode; highPass: BiquadFilterNode; lowPass: BiquadFilterNode; distortion: WaveShaperNode; panner: StereoPannerNode; gain: GainNode }> = new Map();

  private constructor() {
    this.audioContext = new AudioContext();
  }

  public static getInstance(): AudioProcessor {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor();
    }
    return AudioProcessor.instance;
  }

  public processRemoteTrack(track: RemoteTrack, profile?: Profile) {
    if (track.kind !== Track.Kind.Audio || !track.mediaStream) return;
    const trackSid = track.sid;
    if (this.trackProcessors.has(trackSid)) return;

    const source = this.audioContext.createMediaStreamSource(track.mediaStream);

    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = profile?.compression ? -45 : -55;
    compressor.knee.value = 30;
    compressor.ratio.value = profile?.compression ? 12 : 8;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    const highPass = this.audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = profile?.highPass ?? 400;

    const lowPass = this.audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = profile?.lowPass ?? 3500;

    const distortion = this.audioContext.createWaveShaper();
    distortion.curve = this.createDistortionCurve(profile?.distortion ? profile.distortion * 100 : 0);
    distortion.oversample = '4x';

    const panner = this.audioContext.createStereoPanner();
    const gain = this.audioContext.createGain();
    gain.gain.value = 1;

    source.connect(compressor);
    compressor.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(distortion);
    distortion.connect(panner);
    panner.connect(gain);
    gain.connect(this.audioContext.destination);

    this.trackProcessors.set(trackSid, { source, compressor, highPass, lowPass, distortion, panner, gain });
  }

  public updateDistortion(trackSid: string, quality: number) {
    const processor = this.trackProcessors.get(trackSid);
    if (processor) {
      const amount = (1 - quality) * 100;
      processor.distortion.curve = this.createDistortionCurve(amount);
    }
  }

  public updatePanAndGain(trackSid: string, pan: number, gainValue: number) {
    const processor = this.trackProcessors.get(trackSid);
    if (processor) {
      processor.panner.pan.value = pan;
      processor.gain.gain.value = gainValue;
    }
  }

  public stopProcessing(trackSid: string) {
    const processor = this.trackProcessors.get(trackSid);
    if (processor) {
      processor.source.disconnect();
      this.trackProcessors.delete(trackSid);
    }
  }

  private createDistortionCurve(amount: number): Float32Array {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

export default AudioProcessor;
