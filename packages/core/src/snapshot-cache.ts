/** Bounded public-snapshot cache with single-flight reads and safe invalidation. */
export class SnapshotCache<T> {
  private entries = new Map<string, { promise: Promise<T>; expiresAt: number }>();

  constructor(private readonly read: (id: string) => Promise<T>, private readonly ttlMs = 750,
    private readonly capacity = 200, private readonly now = Date.now) {}

  get(id: string): Promise<T> {
    const cached = this.entries.get(id);
    if (cached && cached.expiresAt > this.now()) return cached.promise;
    this.entries.delete(id);
    const entry = { promise: Promise.resolve().then(() => this.read(id)), expiresAt: Infinity };
    this.entries.set(id, entry);
    if (this.entries.size > this.capacity) this.entries.delete(this.entries.keys().next().value!);
    void entry.promise.then(() => {
      if (this.entries.get(id) === entry) entry.expiresAt = this.now() + this.ttlMs;
    }, () => {
      if (this.entries.get(id) === entry) this.entries.delete(id);
    });
    return entry.promise;
  }

  invalidate(id: string): void { this.entries.delete(id); }
  clear(): void { this.entries.clear(); }
}
