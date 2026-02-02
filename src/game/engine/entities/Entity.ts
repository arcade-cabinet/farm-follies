/**
 * Entity - Base class for all game entities
 *
 * Uses composition over inheritance - entities are data containers
 * that hold components. Systems operate on entities with specific components.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Transform {
  position: Vector2;
  rotation: number;
  scale: Vector2;
}

export interface Velocity {
  linear: Vector2;
  angular: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface EntityComponents {
  transform: Transform;
  velocity?: Velocity;
  bounds?: Bounds;
  [key: string]: unknown;
}

let entityIdCounter = 0;

/**
 * Reset the entity ID counter (call at game start)
 */
export function resetEntityIdCounter(): void {
  entityIdCounter = 0;
}

/**
 * Generate a unique entity ID
 */
export function generateEntityId(prefix: string = "entity"): string {
  return `${prefix}_${Date.now()}_${++entityIdCounter}`;
}

/**
 * Base entity interface - all entities must have these
 */
export interface Entity {
  /** Unique identifier */
  readonly id: string;
  /** Entity type for filtering */
  readonly type: string;
  /** Whether entity is active (processed by systems) */
  active: boolean;
  /** Transform component (always present) */
  transform: Transform;
  /** Optional velocity component */
  velocity?: Velocity;
  /** Optional bounds component */
  bounds?: Bounds;
}

/**
 * Create a basic entity with transform
 */
export function createEntity(
  type: string,
  x: number,
  y: number,
  options: {
    id?: string;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    velocityX?: number;
    velocityY?: number;
  } = {}
): Entity {
  const entity: Entity = {
    id: options.id ?? generateEntityId(type),
    type,
    active: true,
    transform: {
      position: { x, y },
      rotation: options.rotation ?? 0,
      scale: { x: options.scaleX ?? 1, y: options.scaleY ?? 1 },
    },
  };

  if (options.width !== undefined || options.height !== undefined) {
    entity.bounds = {
      width: options.width ?? 50,
      height: options.height ?? 50,
    };
  }

  if (options.velocityX !== undefined || options.velocityY !== undefined) {
    entity.velocity = {
      linear: { x: options.velocityX ?? 0, y: options.velocityY ?? 0 },
      angular: 0,
    };
  }

  return entity;
}

/**
 * Check if entity has a component
 */
export function hasComponent<T extends keyof EntityComponents>(
  entity: Entity,
  component: T
): entity is Entity & { [K in T]: NonNullable<EntityComponents[K]> } {
  return component in entity && entity[component as keyof Entity] !== undefined;
}

/**
 * Get entity center position
 */
export function getEntityCenter(entity: Entity): Vector2 {
  const { position } = entity.transform;
  if (entity.bounds) {
    return {
      x: position.x + entity.bounds.width / 2,
      y: position.y + entity.bounds.height / 2,
    };
  }
  return { ...position };
}

/**
 * Get entity bounding box in world coordinates
 */
export function getEntityBounds(entity: Entity): {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const { position, scale } = entity.transform;
  const width = (entity.bounds?.width ?? 0) * scale.x;
  const height = (entity.bounds?.height ?? 0) * scale.y;

  return {
    x: position.x,
    y: position.y,
    width,
    height,
    centerX: position.x + width / 2,
    centerY: position.y + height / 2,
  };
}

/**
 * Check if a point is inside an entity's bounds
 */
export function isPointInEntity(entity: Entity, x: number, y: number): boolean {
  const bounds = getEntityBounds(entity);
  return (
    x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height
  );
}

/**
 * Calculate distance between two entities
 */
export function getEntityDistance(a: Entity, b: Entity): number {
  const centerA = getEntityCenter(a);
  const centerB = getEntityCenter(b);
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Move entity by velocity * dt
 */
export function applyVelocity(entity: Entity, dt: number): void {
  if (!entity.velocity) return;

  const dtSeconds = dt / 1000;
  entity.transform.position.x += entity.velocity.linear.x * dtSeconds * 60;
  entity.transform.position.y += entity.velocity.linear.y * dtSeconds * 60;
  entity.transform.rotation += entity.velocity.angular * dtSeconds * 60;
}

/**
 * Apply force to entity velocity
 */
export function applyForce(entity: Entity, forceX: number, forceY: number): void {
  if (!entity.velocity) {
    entity.velocity = { linear: { x: 0, y: 0 }, angular: 0 };
  }
  entity.velocity.linear.x += forceX;
  entity.velocity.linear.y += forceY;
}

/**
 * Clone an entity with a new ID
 */
export function cloneEntity(entity: Entity, newId?: string): Entity {
  return {
    ...entity,
    id: newId ?? generateEntityId(entity.type),
    transform: {
      position: { ...entity.transform.position },
      rotation: entity.transform.rotation,
      scale: { ...entity.transform.scale },
    },
    velocity: entity.velocity
      ? {
          linear: { ...entity.velocity.linear },
          angular: entity.velocity.angular,
        }
      : undefined,
    bounds: entity.bounds ? { ...entity.bounds } : undefined,
  };
}
