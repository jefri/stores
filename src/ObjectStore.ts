import {EventEmitter} from 'events';
import {
  IRuntime,
  IStore,
  ITransaction,
  JEFRiAttributes,
  StoreExecutionType
} from 'jefri';

export interface ObjectStoreOptions extends JEFRiAttributes {
  runtime: IRuntime
}

export class ObjectStore extends EventEmitter implements IStore {
  constructor(opts: JEFRiAttributes) { super(); }

  execute(how: StoreExecutionType, t: ITransaction): Promise<ITransaction> {
    switch (how) {
      case StoreExecutionType.get:
        return this.get(t);
      case StoreExecutionType.persist:
        return this.persist(t);
    }
  }

  get(t: ITransaction): Promise<ITransaction> { return Promise.resolve(t); }

  persist(t: ITransaction): Promise<ITransaction> { return Promise.resolve(t); }
}
