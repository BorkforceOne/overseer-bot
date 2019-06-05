
export class StateSave<TStateShape> {
  private internalState: TStateShape;

  constructor(initial: TStateShape) {
    this.internalState = initial;
  }

  public Save(obj: Partial<TStateShape>) {
    this.internalState = {
      ... this.internalState,
      ...obj,
    };
  }

  public Get() {
    return { ... this.internalState };
  }
}
