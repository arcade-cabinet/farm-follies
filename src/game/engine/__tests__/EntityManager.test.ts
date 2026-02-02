/**
 * EntityManager unit tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createEntity, type Entity } from "../entities/Entity";
import { createEntityManager, EntityManager } from "../managers/EntityManager";

describe("EntityManager", () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  describe("add/remove", () => {
    it("should add entity immediately", () => {
      const entity = createEntity("test", 100, 100);
      manager.addImmediate(entity);

      expect(manager.has(entity.id)).toBe(true);
      expect(manager.count).toBe(1);
    });

    it("should queue entity for addition", () => {
      const entity = createEntity("test", 100, 100);
      manager.add(entity);

      // Not added yet (queued)
      expect(manager.has(entity.id)).toBe(false);

      // Flush to apply
      manager.flush();

      expect(manager.has(entity.id)).toBe(true);
    });

    it("should remove entity immediately", () => {
      const entity = createEntity("test", 100, 100);
      manager.addImmediate(entity);
      manager.removeImmediate(entity.id);

      expect(manager.has(entity.id)).toBe(false);
      expect(manager.count).toBe(0);
    });

    it("should queue entity for removal", () => {
      const entity = createEntity("test", 100, 100);
      manager.addImmediate(entity);
      manager.remove(entity.id);

      // Still there (queued for removal)
      expect(manager.has(entity.id)).toBe(true);

      // Flush to apply
      manager.flush();

      expect(manager.has(entity.id)).toBe(false);
    });
  });

  describe("get", () => {
    it("should get entity by id", () => {
      const entity = createEntity("test", 100, 100);
      manager.addImmediate(entity);

      const retrieved = manager.get(entity.id);

      expect(retrieved).toBe(entity);
    });

    it("should return undefined for non-existent id", () => {
      const retrieved = manager.get("non-existent");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("getByType", () => {
    it("should get all entities of a type", () => {
      const entity1 = createEntity("animal", 100, 100);
      const entity2 = createEntity("animal", 200, 200);
      const entity3 = createEntity("powerup", 300, 300);

      manager.addImmediate(entity1);
      manager.addImmediate(entity2);
      manager.addImmediate(entity3);

      const animals = manager.getByType("animal");

      expect(animals.length).toBe(2);
      expect(animals).toContain(entity1);
      expect(animals).toContain(entity2);
    });

    it("should return empty array for non-existent type", () => {
      const result = manager.getByType("nonexistent");

      expect(result).toEqual([]);
    });
  });

  describe("query", () => {
    it("should query by type", () => {
      manager.addImmediate(createEntity("animal", 100, 100));
      manager.addImmediate(createEntity("powerup", 200, 200));

      const result = manager.query({ type: "animal" });

      expect(result.length).toBe(1);
      expect(result[0].type).toBe("animal");
    });

    it("should query by active status", () => {
      const active = createEntity("test", 100, 100);
      const inactive = createEntity("test", 200, 200);
      inactive.active = false;

      manager.addImmediate(active);
      manager.addImmediate(inactive);

      const result = manager.query({ active: true });

      expect(result.length).toBe(1);
      expect(result[0].active).toBe(true);
    });

    it("should query with custom filter", () => {
      manager.addImmediate(createEntity("test", 100, 100));
      manager.addImmediate(createEntity("test", 200, 200));
      manager.addImmediate(createEntity("test", 300, 300));

      const result = manager.query({
        filter: (e) => e.transform.position.x > 150,
      });

      expect(result.length).toBe(2);
    });
  });

  describe("update/replace", () => {
    it("should update entity in place", () => {
      const entity = createEntity("test", 100, 100);
      manager.addImmediate(entity);

      manager.update(entity.id, { active: false });

      expect(manager.get(entity.id)?.active).toBe(false);
    });

    it("should replace entity completely", () => {
      const original = createEntity("test", 100, 100, { id: "test-1" });
      manager.addImmediate(original);

      const replacement = createEntity("test", 200, 200, { id: "test-1" });
      manager.replace(replacement);

      const retrieved = manager.get("test-1");
      expect(retrieved?.transform.position.x).toBe(200);
    });
  });

  describe("iteration", () => {
    it("should forEach over all entities", () => {
      manager.addImmediate(createEntity("test", 100, 100));
      manager.addImmediate(createEntity("test", 200, 200));

      const visited: Entity[] = [];
      manager.forEach((e) => visited.push(e));

      expect(visited.length).toBe(2);
    });

    it("should map over all entities", () => {
      manager.addImmediate(createEntity("test", 100, 100));
      manager.addImmediate(createEntity("test", 200, 200));

      const positions = manager.map((e) => e.transform.position.x);

      expect(positions).toContain(100);
      expect(positions).toContain(200);
    });

    it("should find entity matching predicate", () => {
      manager.addImmediate(createEntity("test", 100, 100, { id: "a" }));
      manager.addImmediate(createEntity("test", 200, 200, { id: "b" }));

      const found = manager.find((e) => e.transform.position.x === 200);

      expect(found?.id).toBe("b");
    });

    it("should filter entities by predicate", () => {
      manager.addImmediate(createEntity("test", 100, 100));
      manager.addImmediate(createEntity("test", 200, 200));
      manager.addImmediate(createEntity("test", 300, 300));

      const filtered = manager.filter((e) => e.transform.position.x >= 200);

      expect(filtered.length).toBe(2);
    });
  });

  describe("spatial queries", () => {
    it("should get entities in radius", () => {
      manager.addImmediate(createEntity("test", 100, 100)); // In radius
      manager.addImmediate(createEntity("test", 110, 110)); // In radius
      manager.addImmediate(createEntity("test", 500, 500)); // Out of radius

      const inRadius = manager.getInRadius(100, 100, 50);

      expect(inRadius.length).toBe(2);
    });

    it("should filter by type in radius query", () => {
      manager.addImmediate(createEntity("animal", 100, 100));
      manager.addImmediate(createEntity("powerup", 110, 110));

      const animals = manager.getInRadius(100, 100, 50, "animal");

      expect(animals.length).toBe(1);
      expect(animals[0].type).toBe("animal");
    });
  });

  describe("clear", () => {
    it("should remove all entities", () => {
      manager.addImmediate(createEntity("test", 100, 100));
      manager.addImmediate(createEntity("test", 200, 200));

      manager.clear();

      expect(manager.count).toBe(0);
    });
  });
});

describe("createEntityManager", () => {
  it("should create manager with initial entities", () => {
    const entities = [createEntity("test", 100, 100), createEntity("test", 200, 200)];

    const manager = createEntityManager(entities);

    expect(manager.count).toBe(2);
  });
});
