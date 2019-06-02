
export class StateSave<StateShape> {
  private internalState: StateShape;

  constructor(initial: StateShape) {
    this.internalState = initial;
  }

  public Save(obj: Partial<StateShape>) {
    this.internalState = {
      ... this.internalState,
      ...obj,
    };
  }

  public Get() {
    return { ... this.internalState };
  }
}
