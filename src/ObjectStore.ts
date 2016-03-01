import {EventEmitter} from 'events';
import {
  AnyEntity,
  BareEntity,
  Entity,
  EntitySpec,
  IRuntime,
  IStore,
  ITransaction,
  JEFRiAttributes,
  EntityProperty,
  EntityRelationship,
  StoreExecutionType,
  Transaction
} from 'jefri';

export interface ObjectStoreOptions extends JEFRiAttributes {}

let flatten = <T>(p: T[], c: T[]): T[] => p.concat(c);
let dedupeEntityArray = (a: BareEntity[]): BareEntity[] => {
  type idHolder = {[k: string]: BareEntity};
  let ids = a.reduce((ids: idHolder, b: BareEntity) => {
    ids[`${b._type}/${b._id}`] = b;
    return ids;
  }, {});
  return Object.keys(ids).map((k) => ids[k]);
};

export class ObjectStore extends EventEmitter implements IStore {
  private _store: {[k: string]: string} = {};
  public $printDebug() { console.log(this._store); }
  constructor(public runtime: IRuntime, private opts: ObjectStoreOptions = {}) {
    super();
  }

  // ### execute*(type, transaction)*
  // Run the transaction.
  execute(how: StoreExecutionType,
          transaction: ITransaction<AnyEntity | EntitySpec>):
      Promise<ITransaction<Entity>> {
    this.emit("sending", transaction);

    switch (how) {
      case StoreExecutionType.get:
        return this.do_get(transaction as ITransaction<EntitySpec>);
      case StoreExecutionType.persist:
        return this.do_persist(transaction as ITransaction<AnyEntity>);
    }
  }

  // The public `get` method, to start a transaction of EntitySpec lookup.
  get(transaction: ITransaction<EntitySpec>): Promise<ITransaction<Entity>> {
    return this.execute(StoreExecutionType.get, transaction);
  }

  // The public `persist` method, to save a collection of Entities.
  persist(transaction: ITransaction<AnyEntity>): Promise<ITransaction<Entity>> {
    return this.execute(StoreExecutionType.persist, transaction);
  }

  // The internal `get` implementaion.
  do_get(transaction: ITransaction<EntitySpec>): Promise<ITransaction<Entity>> {
    type BareEntityCollection =
        BareEntity | BareEntity[] | {[k: string]: BareEntity};
    let ents: {[k: string]: Entity} = {};
    let lookup = (_: EntitySpec): BareEntity[] => this._lookup(_);
    let entities = transaction.entities.map<BareEntity[]>(lookup)
                       .reduce<BareEntity[]>(flatten, [])
                       .filter((_: BareEntity) => _ != null)
                       .map((_: BareEntity) => this._construct(_));
    return Promise.resolve(new Transaction<Entity>().add(entities));
  }

  _lookup(spec: EntitySpec): BareEntity[] {
    let def = this.runtime.definition(spec._type);
    let expand = (id: string) =>
        JSON.parse(this._get(this._key({_type: spec._type, _id: id})));
    let results: BareEntity[] = Object.keys(this._type(spec._type)).map(expand);

    if (results.length === 0) {
      return results;
    }
    if (def.key in spec) {
      results = results.filter((e: BareEntity) => e._id === spec[def.key]);
    }
    for (let name in def.properties) {
      if (name in spec && name !== def.key) {
        let property = def.properties[name];
        results = results.filter(this._sieve(name, property, spec[name]));
      }
    }

    let findRelatedSingle =
        (spec: EntitySpec, relationship: EntityRelationship) =>
            (entity: BareEntity) => {
              return this._lookup(<EntitySpec>Object.assign({}, spec, {
                _type: relationship.to.type,
                [relationship.to.property]: entity[relationship.property]
              }))
            };

    let findRelatedList =
        (relationship: EntityRelationship) => {
          return (entity: BareEntity): BareEntity[] => {
            let ids = <string[]>entity[relationship.property];
            let findWithRelspec = (other: string) => {
              let relspec: EntitySpec = {
                _type: relationship.to.type,
                [relationship.to.property]: other
              };
              return this._lookup(relspec);
            };
            return ids.map(findWithRelspec).reduce<BareEntity[]>(flatten, []);
          };
        }

    let findRelationships = (name: string) => {
      let relationship = def.relationships[name];
      let findRelated: (e: BareEntity) => BareEntity[];
      if ("list" === def.properties[relationship.property].type) {
        findRelated = findRelatedList(relationship);
      } else {
        findRelated = findRelatedSingle(spec[name], relationship);
      }
      let found: BareEntity[] =
          results.map(findRelated).reduce<BareEntity[]>(flatten, []);
      return found;
    };

    return dedupeEntityArray(
        results.concat(Object.keys(def.relationships || {})
                           .filter((name: string) => name in spec)
                           .map<BareEntity[]>(findRelationships)
                           .reduce<BareEntity[]>(flatten, [])
                           .filter((e) => !!e)));
  }

  _sieve(name: string, property: EntityProperty,
         spec: any): (e: BareEntity) => boolean {
    if (Number.isFinite(spec)) {
      if (spec % 1 === 0) {
        spec = ['=', spec];
      } else {
        spec = [spec, 8];
      }
    }
    if (typeof spec === 'string') {
      spec = ['REGEX', '.*' + spec + '.*'];
    }
    if (!spec) {
      spec = ['=', void 0];
    }
    if (!Array.isArray(spec)) {
      throw {
        message: "Lookup specification is invalid (in LocalStore::_sieve).",
        name: name,
        property: property,
        spec: spec
      };
    }
    if (Number.isFinite(spec[0])) {
      return (entity: BareEntity): boolean => {
        return Math.abs(<number>entity[name] - spec[0]) < Math.pow(2, +spec[1]);
      };
    }
    // if (Array.isArray(spec[0])) {
    //   spec[i] = (function() {
    //     var l, len, results1;
    //     results1 = [];
    //     for (i = l = 0, len = spec.length; l < len; i = ++l) {
    //       s = spec[i];
    //       results1.push(_sieve(name, property, spec[i]));
    //     }
    //     return results1;
    //   })();
    //   return (entity: BareEntity): boolean => {
    //     var filter, l, len;
    //     for (l = 0, len = spec.length; l < len; l++) {
    //       filter = spec[l];
    //       if (!filter(entity)) {
    //         return false;
    //       }
    //     }
    //     return true;
    //   };
    // }
    switch (spec[0]) {
      case "=":
        return (entity: BareEntity): boolean => {
          return entity[name] === spec[1];
        };
      case "<=":
        return (entity: BareEntity): boolean => {
          return entity[name] <= spec[1];
        };
      case ">=":
        return (entity: BareEntity): boolean => {
          return entity[name] >= spec[1];
        };
      case "<":
        return (entity: BareEntity): boolean => {
          return entity[name] < spec[1];
        };
      case ">":
        return (entity: BareEntity): boolean => {
          return entity[name] > spec[1];
        };
      case "REGEX":
        return (entity: BareEntity): boolean => {
          return new RegExp(<string>spec[1]).test("" + entity[name]);
        };
      default:
        return (entity: BareEntity): boolean => {
          let field: any;
          while (field = spec.shift) {
            if (entity[name] === field) {
              return true;
            }
          }
          return false;
        };
    }
  }

  // The internal `persist` implementaion.
  do_persist(transaction: ITransaction<AnyEntity>):
      Promise<ITransaction<Entity>> {
    return Promise.resolve(new Transaction<Entity>().add(
        transaction.entities.map((_) => this._decode(_))
            .map((_: BareEntity) => this._save(_))
            .map((_: BareEntity) => this._construct(_))));
  }

  _decode(entity: AnyEntity): BareEntity {
    return typeof(<Entity>entity)._encode === 'function' ?
               (<Entity>entity)._encode() :
               <BareEntity>entity;
  }

  _construct(bare: BareEntity): Entity {
    return this.runtime.build<Entity>(bare._type, bare);
  }

  // #### _save*(entity)*
  // Save the data in the store's storage.
  _save(entity: BareEntity): BareEntity {
    // Merge the new data over the old data.
    entity = Object.assign(this._find(entity), entity);
    // Store the JSON of the entity.
    this._set(this._key(entity), JSON.stringify(entity));
    // Register the entity with the type map.
    this._type(entity._type, entity._id);
    // Return the bare encoded object.
    return entity;
  }

  // ### _key*(entity: BareEntity): string*
  _key(entity: BareEntity): string { return entity._type + '/' + entity._id; }

  // #### _type*(type[, id])*
  // Get a set of stored IDs for a particular type. If an ID is passed in,
  // add it to the set.
  _type(type: string, id: string = null): {[k: string]: any} {
    // Get the current set
    let list: {[k: string]: any} = JSON.parse(this._get(type));
    if (id !== null) {
      // Indexed by ID, so just need an empty set.
      list[id] = "";
      // Restringify. Silly hashmaps being string -> string
      this._set(type, JSON.stringify(list));
    }
    // Return the list.
    return list;
  }

  // ### _find*(entity)*
  _find(entity: BareEntity): BareEntity {
    return JSON.parse(this._get(this._key(entity))) as BareEntity;
  }

  // #### _set*(key, value)*
  // Generic key/value setter, should be overwritten by extending classes.
  public _set(key: string, value: string): void { this._store[key] = value; }

  // #### _get*(key)*
  // Generic key/value getter, should be overwritten by extending classes.
  public _get(key: string): string { return this._store[key] || '{}'; }
}
