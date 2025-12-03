export type Point2D = { x: number; y: number };

interface StageDimensions {
  width: number;
  height: number;
}

class SpatialMixer {
  private stage: StageDimensions;

  constructor(stage: StageDimensions = { width: 960, height: 640 }) {
    this.stage = stage;
  }

  public setStage(stage: StageDimensions) {
    this.stage = stage;
  }

  public calculateMix(node: Point2D, listener: Point2D) {
    const pan = this.clamp((node.x - listener.x) / (this.stage.width / 2), -1, 1);
    const distance = Math.hypot(node.x - listener.x, node.y - listener.y);
    const maxDistance = Math.hypot(this.stage.width, this.stage.height);
    const gain = this.clamp(1 - distance / (maxDistance * 0.5), 0, 1);
    return {
      pan: Number(pan.toFixed(2)),
      gain: Number(gain.toFixed(2)),
      distance,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}

export default SpatialMixer;
