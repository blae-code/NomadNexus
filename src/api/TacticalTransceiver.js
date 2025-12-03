// Temporary stub for tactical transceiver until LiveKit wiring is complete.
class TacticalTransceiver {
  constructor() {
    this.callbacks = {};
  }
  setDataCallback(cb) {
    this.callbacks.data = cb;
  }
  publishData() {}
  publishFlare() {}
  publishMuteAll() {}
}

export default TacticalTransceiver;
