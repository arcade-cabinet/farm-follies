/**
 * EntityManager - Manages all game entities with efficient querying
 * 
 * Provides:
 * - Entity storage and retrieval by ID
 * - Querying entities by type
 * - Entity lifecycle (add, remove, update)
 * - Spatial queries (future: quadtree)
 */

import type { Entity } from '../entities/Entity';

export interface EntityQuery<T extends Entity = Entity> {
  type?: string;
  active?: boolean;
  filter?: (entity: T) => boolean;
}

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private entitiesByType: Map<string, Set<string>> = new Map();
  private pendingAdd: Entity[] = [];
  private pendingRemove: Set<string> = new Set();
  private dirty = false;

  /**
   * Add an entity (queued until flush)
   */
  add<T extends Entity>(entity: T): T {
    this.pendingAdd.push(entity);
    this.dirty = true;
    return entity;
  }

  /**
   * Add an entity immediately (use during initialization)
   */
  addImmediate<T extends Entity>(entity: T): T {
    this.entities.set(entity.id, entity);
    
    if (!this.entitiesByType.has(entity.type)) {
      this.entitiesByType.set(entity.type, new Set());
    }
    this.entitiesByType.get(entity.type)!.add(entity.id);
    
    return entity;
  }

  /**
   * Mark an entity for removal (queued until flush)
   */
  remove(entityOrId: Entity | string): void {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
    this.pendingRemove.add(id);
    this.dirty = true;
  }

  /**
   * Remove an entity immediately
   */
  removeImmediate(entityOrId: Entity | string): void {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
    const entity = this.entities.get(id);
    
    if (entity) {
      this.entities.delete(id);
      this.entitiesByType.get(entity.type)?.delete(id);
    }
  }

  /**
   * Get an entity by ID
   */
  get<T extends Entity>(id: string): T | undefined {
    return this.entities.get(id) as T | undefined;
  }

  /**
   * Check if an entity exists
   */
  has(id: string): boolean {
    return this.entities.has(id);
  }

  /**
   * Get all entities of a specific type
   */
  getByType<T extends Entity>(type: string): T[] {
    const ids = this.entitiesByType.get(type);
    if (!ids) return [];
    
    const result: T[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      if (entity) result.push(entity as T);
    }
    return result;
  }

  /**
   * Query entities with flexible criteria
   */
  query<T extends Entity>(query: EntityQuery<T> = {}): T[] {
    let result: Entity[];
    
    if (query.type) {
      result = this.getByType(query.type);
    } else {
      result = Array.from(this.entities.values());
    }
    
    if (query.active !== undefined) {
      result = result.filter(e => e.active === query.active);
    }
    
    if (query.filter) {
      result = result.filter(e => query.filter!(e as T));
    }
    
    return result as T[];
  }

  /**
   * Get all active entities
   */
  getActive(): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.active);
  }

  /**
   * Get all entities
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entity count
   */
  get count(): number {
    return this.entities.size;
  }

  /**
   * Get count by type
   */
  getCountByType(type: string): number {
    return this.entitiesByType.get(type)?.size ?? 0;
  }

  /**
   * Flush pending additions and removals
   * Call this at the start of each frame
   */
  flush(): void {
    if (!this.dirty) return;
    
    // Process removals first
    for (const id of this.pendingRemove) {
      this.removeImmediate(id);
    }
    this.pendingRemove.clear();
    
    // Process additions
    for (const entity of this.pendingAdd) {
      this.addImmediate(entity);
    }
    this.pendingAdd.length = 0;
    
    this.dirty = false;
  }

  /**
   * Update an entity in place
   */
  update<T extends Entity>(id: string, updates: Partial<T>): T | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;
    
    Object.assign(entity, updates);
    return entity as T;
  }

  /**
   * Replace an entity completely
   */
  replace<T extends Entity>(entity: T): T {
    if (!this.entities.has(entity.id)) {
      return this.addImmediate(entity);
    }
    
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Iterate over all entities
   */
  forEach(callback: (entity: Entity) => void): void {
    this.entities.forEach(callback);
  }

  /**
   * Map over all entities
   */
  map<T>(callback: (entity: Entity) => T): T[] {
    return Array.from(this.entities.values()).map(callback);
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.entitiesByType.clear();
    this.pendingAdd.length = 0;
    this.pendingRemove.clear();
    this.dirty = false;
  }

  /**
   * Find the first entity matching a predicate
   */
  find<T extends Entity>(predicate: (entity: Entity) => boolean): T | undefined {
    for (const entity of this.entities.values()) {
      if (predicate(entity)) return entity as T;
    }
    return undefined;
  }

  /**
   * Find all entities matching a predicate
   */
  filter<T extends Entity>(predicate: (entity: Entity) => boolean): T[] {
    const result: T[] = [];
    for (const entity of this.entities.values()) {
      if (predicate(entity)) result.push(entity as T);
    }
    return result;
  }

  /**
   * Get entities within a radius of a point
   * (Simple implementation - future: use spatial hash/quadtree)
   */
  getInRadius(
    x: number,
    y: number,
    radius: number,
    type?: string
  ): Entity[] {
    const radiusSq = radius * radius;
    const entities = type ? this.getByType(type) : this.getAll();
    
    return entities.filter(entity => {
      const dx = entity.transform.position.x - x;
      const dy = entity.transform.position.y - y;
      return dx * dx + dy * dy <= radiusSq;
    });
  }
}

/**
 * Create an entity manager with initial entities
 */
export function createEntityManager(
  initialEntities: Entity[] = []
): EntityManager {
  const manager = new EntityManager();
  for (const entity of initialEntities) {
    manager.addImmediate(entity);
  }
  return manager;
}
