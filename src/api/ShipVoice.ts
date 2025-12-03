// src/api/ShipVoice.ts

class ShipVoice {
    private synthesizer: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private audioContext: AudioContext;
    private gainNode: GainNode;

    constructor() {
        this.synthesizer = window.speechSynthesis;
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0; // Default volume
        this.gainNode.connect(this.audioContext.destination);

        this.synthesizer.onvoiceschanged = () => {
            this.setVoiceProfile();
        };
        // In case voices are already loaded
        this.setVoiceProfile(); 
    }

    private setVoiceProfile() {
        const voices = this.synthesizer.getVoices();
        // Try to find a female, robotic-sounding voice. This might vary by browser.
        this.voice = voices.find(
            (v) => v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Microsoft Zira'))
        ) || null;
        // Fallback to any English female voice if specific ones aren't found
        if (!this.voice) {
            this.voice = voices.find((v) => v.lang.startsWith('en') && v.gender === 'female') || null;
        }
        console.log('ShipVoice: Voice profile set to', this.voice?.name);
    }

    public announce(message: string, pitch: number = 1.0, rate: number = 1.0) {
        if (!this.voice) {
            console.warn('ShipVoice: No suitable voice found for announcement.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = this.voice;
        utterance.pitch = pitch; // 0 to 2
        utterance.rate = rate; // 0.1 to 10

        // Optional: Apply Web Audio API processing for a more "ship computer" feel
        // This is more complex as SpeechSynthesis doesn't directly output to Web Audio API nodes easily.
        // For simplicity, we'll rely on voice selection and pitch/rate.
        // If advanced processing is needed, we'd need a different approach (e.g., pre-recorded samples or more complex API interaction).

        this.synthesizer.speak(utterance);
    }

    public playFlareAlert(variant: 'COMBAT' | 'MEDICAL') {
        let message = '';
        switch (variant) {
            case 'COMBAT':
                message = "Warning: Hostile Contact Reported.";
                break;
            case 'MEDICAL':
                message = "Alert: Vital Signs Critical.";
                break;
        }
        this.announce(message, 1.1, 0.9); // Slight pitch shift, slightly slower
    }

    public playMuteAllAlert() {
        this.announce("Channel priority overridden.", 1.2, 1.0); // Higher pitch, normal speed
    }

    // You could add methods here to intercept and process browser audio output if needed,
    // but direct SpeechSynthesis output to a Web Audio graph is not straightforward.
    // For now, it directly outputs to the default audio output.
}

export default ShipVoice;
