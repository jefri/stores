import {expect} from 'chai';
import {
  ITransaction,
  EntitySpec,
  AnyEntity,
  BareEntity,
  Entity,
  EntityArray,
  Runtime,
  Transaction,
  isEntity
} from 'jefri';

import {ObjectStore} from '../../src/index';

import {User, Authinfo} from '../contexts/typings/user-context.d';

describe("JEFRi ObjectStore", function() {
  let runtime: Runtime = null;
  describe("with JEFRi Context context", function() {
    beforeEach(function(done) {
      runtime = new Runtime(
          "https://raw.githubusercontent.com/jefri/stores/master/test/contexts/context.json");
      runtime.ready.then(() => done(), done);
    });

    it("Returns deeply nested graphs", function(done) {
      let s = new ObjectStore(runtime);
      let transaction = new Transaction<BareEntity>();
      transaction.add([
        {
          "_type": "Context",
          "_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
          "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
          "name": "DEFAULT_CONTEXT"
        },
        {
          "_type": "Entity",
          "_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
          "name": "Host",
          "key": "host_id"
        },
        {
          "_type": "Property",
          "_id": "b010d17a-6af2-4f6c-bf52-7a25bf53bdd5",
          "property_id": "b010d17a-6af2-4f6c-bf52-7a25bf53bdd5",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "name": "host_id",
          "type": "string"
        },
        {
          "_type": "Property",
          "_id": "1a7ffa49-24e3-42c6-9a3e-7d35d53c88ba",
          "property_id": "1a7ffa49-24e3-42c6-9a3e-7d35d53c88ba",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "name": "hostname",
          "type": "string"
        },
        {
          "_type": "Property",
          "_id": "dcfe2ec7-ab94-41d8-b0e4-d782e5411bcb",
          "property_id": "dcfe2ec7-ab94-41d8-b0e4-d782e5411bcb",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "name": "ip",
          "type": "string"
        },
        {
          "_type": "Property",
          "_id": "17aed1ce-7979-436b-9366-1f0911f53266",
          "property_id": "17aed1ce-7979-436b-9366-1f0911f53266",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "name": "mac",
          "type": "string"
        },
        {
          "_type": "Property",
          "_id": "a21c53d3-f0b3-45f5-837b-722682bc8f8c",
          "property_id": "a21c53d3-f0b3-45f5-837b-722682bc8f8c",
          "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "name": "router_id",
          "type": "string"
        },
        {
          "_type": "Relationship",
          "_id": "89d1be07-3459-4b7b-b15f-ab9a5379466a",
          "relationship_id": "89d1be07-3459-4b7b-b15f-ab9a5379466a",
          "name": "router",
          "type": "has_a",
          "to_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "to_property": "router_id",
          "from_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "from_property": "router_id",
          "back": "hosts"
        },
        {
          "_type": "Entity",
          "_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
          "name": "Router",
          "key": "router_id"
        },
        {
          "_type": "Property",
          "_id": "d8d42791-9dc7-4208-bb44-0c51ad1775d9",
          "property_id": "d8d42791-9dc7-4208-bb44-0c51ad1775d9",
          "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "name": "router_id",
          "type": "string"
        },
        {
          "_type": "Property",
          "_id": "21dfa81b-4b73-496f-a4df-f798c9336c9a",
          "property_id": "21dfa81b-4b73-496f-a4df-f798c9336c9a",
          "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "name": "name",
          "type": "string"
        },
        {
          "_type": "Relationship",
          "_id": "fbaf51e3-de97-4bc0-b7b4-34ef05b1fd2e",
          "relationship_id": "fbaf51e3-de97-4bc0-b7b4-34ef05b1fd2e",
          "name": "hosts",
          "type": "has_many",
          "to_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
          "to_property": "router_id",
          "from_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
          "from_property": "router_id",
          "back": "router"
        }
      ]);
      s.persist(transaction)
          .then(function(data: ITransaction<Entity>) {
            let getTransaction = new Transaction<EntitySpec>();
            getTransaction.add([
              {
                "_type": "Context",
                "entities": {"properties": {}, "relationships": {}}
              }
            ]);
            s.get(getTransaction)
                .then(function(data: ITransaction<Entity>) {
                  expect(data.entities.length)
                      .to.equal(12, "Got all entities back.");
                  done();
                })["catch"](done);
          })["catch"](done);
    });
  });

  describe("with user context", function() {
    beforeEach(function() {
      runtime = new Runtime(
          "https://raw.githubusercontent.com/jefri/stores/master/test/contexts/user.json");
    });
    it("ObjectStore minimal save", function(done) {
      runtime.ready.then(function() {
        let store = new ObjectStore(runtime);
        let transaction = new Transaction<Entity>();
        let user = runtime.build<User>(
            "User", {name: "southerd", address: "davidsouther@gmail.com"});
        user.authinfo = runtime.build<Authinfo>("Authinfo", {});
        let authinfo = user.authinfo;
        transaction.add([user, authinfo]);
        store.persist(transaction)
            .then(function(transaction) {
              expect(transaction.entities).to.exist;
              // expect(transaction.attributes).to.exist;
              expect(transaction.entities.length).to.equal(2);
              expect(isEntity(transaction.entities[0])).to.be.true;
              expect(isEntity(transaction.entities[1])).to.be.true;
              done();
            })["catch"](done);
      })["catch"](done);
    });

    let users = [
      [
        "David Souther",
        "davidsouther@gmail.com",
        {
          username: "southerd",
          activated: "true",
          created: new Date(2011, 1, 15, 15, 34, 5).toJSON(),
          last_ip: "192.168.2.79"
        }
      ],
      [
        "JPorta",
        "jporta@example.com",
        {
          username: "portaj",
          activated: "true",
          created: new Date(2012, 1, 15, 15, 34, 5).toJSON(),
          last_ip: "192.168.2.80"
        }
      ],
      [
        "Niemants",
        "andrew@example.com",
        {
          username: "andrew",
          activated: "false",
          created: new Date(2012, 1, 17, 15, 34, 5).toJSON(),
          last_ip: "80.234.2.79"
        }
      ]
    ];
    it("can get previously persisted", function(done) {
      runtime.ready.then(function() {
        let store = new ObjectStore(runtime);
        let transaction = new Transaction<Entity>();
        for (let i = 0, len = users.length; i < len; i++) {
          let u = users[i];
          let user = runtime.build<User>("User", {name: u[0], address: u[1]});
          let authinfo = runtime.build<Authinfo>(
              "Authinfo", Object.assign({authinfo_id: user.id()}, u[2]));
          user.authinfo = authinfo;
          transaction.add([user, authinfo]);
        }
        let get = (q: EntitySpec): Promise<ITransaction<Entity>> => {
          return store.get(new Transaction<EntitySpec>().add([q]));
        };
        store.persist(transaction)
            .then(() => {
              return Promise.all([
                              get({_type: "User"})
                                  .then((results: ITransaction<Entity>) => {
                                    expect(results.entities.length).to.equal(3);
                                  }),
                              get({_type: "Authinfo", username: "southerd"})
                                  .then((results: ITransaction<Entity>) => {
                                    expect(results.entities.length).to.equal(1);
                                  }),
                              get({_type: "User", authinfo: {}})
                                  .then((results: ITransaction<Entity>) => {
                                    expect(results.entities.length).to.equal(6);
                                  })
                            ])
                  .then(() => { done(); });
            })["catch"](done);
      })["catch"](done);
    });
  });

  it("has_list", function(done) {
    "Testing has_list relationship persist and retrieve.";
    type Foo =
        Entity & {foo_id: string, bar_ids: string[], bars: EntityArray<Bar>};
    type Bar = Entity & { bar_id: string }

    let runtime = new Runtime("", {
      debug: {
        context: {
          entities: {
            Foo: {
              key: "foo_id",
              properties: {foo_id: {type: "string"}, bar_ids: {type: "list"}},
              relationships: {
                bars: {
                  type: "has_many",
                  property: "bar_ids",
                  to: {type: "Bar", property: "bar_id"}
                }
              }
            },
            Bar: {key: "bar_id", properties: {bar_id: {type: "string"}}}
          }
        }
      }
    });
    let foo = runtime.build<Foo>("Foo");
    let bars = [
      runtime.build<Bar>("Bar"),
      runtime.build<Bar>("Bar"),
      runtime.build<Bar>("Bar")
    ];
    foo.bars.add(bars);
    foo.bars.add(runtime.build<Bar>("Bar"));
    expect(foo.bars.length).to.equal(4);
    expect(foo.bar_ids.length).to.equal(4);
    let store = new ObjectStore(runtime);
    let transaction = new Transaction<Entity>();
    transaction.add([foo]);
    transaction.add(foo.bars.toArray());
    store.persist(transaction)
        .then(() => {
          let get =
              new Transaction<EntitySpec>().add([{_type: "Foo", bars: {}}]);
          store.get(get)
              .then((results: ITransaction<Entity>) => {
                expect(results.entities.length).to.equal(5);
              })
              .then(() => { done(); });
        })["catch"](done);
  });
});
