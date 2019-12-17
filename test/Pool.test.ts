import 'mocha';
import {assert} from 'chai';
import {Pool, PoolConfig, PoolHydrateCallback, PoolReleaseCallback} from "../src/Pool";
import {SlowPool} from "../src/SlowPool";
import {FastPool} from "../src/FastPool";

type PoolGetNew = {
	(
		onHydrate: PoolHydrateCallback<any>,
		onRelease?: PoolReleaseCallback<any>,
		config?: PoolConfig,
	): Pool<any>;
};

describe("Pool - common tests", () => {
	const runAllTests = function(getNew: PoolGetNew, className: string) {
		describe(`${className}`, () => {
			it("Should call hydrate as many times as initial size", () => {
				let hydrations = 0;
				const callback = () => {
					hydrations += 1;
					return {};
				};
				getNew(callback, undefined, {initialSize: 5});

				assert.strictEqual(hydrations, 5);
			});

			it("Should not hydrate when fetching as much elements as requested to have in initial size", () => {
				let hydrations = 0;
				const callback = () => {
					hydrations += 1;
					return {};
				};
				const pool = getNew(callback, undefined, {initialSize: 5});
				hydrations = 0;

				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();

				assert.strictEqual(hydrations, 0);
			});

			it("Should return the current number of available/used/total objects in the pool", () => {
				const pool = getNew(() => new Object(), undefined, {initialSize: 5, autoHydrateSize: 5});

				const retrieved = [];
				for (let i = 0; i <= 5; i++) {
					assert.equal(pool.availableObjects, 5 - i);
					assert.equal(pool.usedObjects, i);
					assert.equal(pool.totalObjects, 5);
					retrieved.push(pool.getOne());	
				}

				while (retrieved.length > 0) {
					assert.equal(pool.availableObjects, 10 - retrieved.length);
					assert.equal(pool.usedObjects, retrieved.length);
					assert.equal(pool.totalObjects, 10);
					pool.release(retrieved.pop());
				}

				assert.equal(pool.availableObjects, 10);
				assert.equal(pool.usedObjects, 0);
				assert.equal(pool.totalObjects, 10);
			});

			it("Should not hydrate when fetching as much elements as requested to have in initial size", () => {
				let hydrations = 0;
				const callback = () => {
					hydrations += 1;
					return {};
				};
				const pool = getNew(callback, undefined, {initialSize: 5});
				hydrations = 0;

				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();

				assert.strictEqual(hydrations, 0);
			});

			it("When running out of pooled instances should hydrate by configured amount", () => {
				let hydrations = 0;
				const callback = () => {
					hydrations += 1;
					return {};
				};
				const pool = getNew(callback, undefined, {initialSize: 5, autoHydrateSize: 3});
				hydrations = 0;

				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();
				pool.getOne();

				assert.strictEqual(hydrations, 3);
			});

			it("Should return a hydrated object", () => {
				const hydrateWith = {};
				const pool = getNew(() => hydrateWith, undefined, {initialSize: 1});

				assert.strictEqual(pool.getOne(), hydrateWith);
			});

			it("Should release the hydrated object back to pool and fetch it again without hydration", () => {
				let hydrations = 0;
				const hydrateWith = {};
				const callback = () => {
					hydrations++;
					return hydrateWith;
				};
				const pool = getNew(callback, undefined, {initialSize: 1});

				const returnedFromPool = pool.getOne();
				pool.release(returnedFromPool);
				assert.strictEqual(pool.getOne(), hydrateWith);
				assert.strictEqual(hydrations, 1);
			});

			it("Should call release callback on release", () => {
				let releasedWith: any = undefined;
				const hydrateWith = {};
				const pool = getNew(() => hydrateWith, object => releasedWith = object, {initialSize: 1});

				pool.release(pool.getOne());
				assert.strictEqual(releasedWith, hydrateWith);
			});

			it("Should hydrate the pool with the specified number of objects", () => {
				let hydrateCount = 0;
				const hydrateCallback = () => {
					hydrateCount++;
					return {};
				};
				const pool = getNew(hydrateCallback, undefined, {initialSize: 5});

				pool.hydrate(5);
				assert.strictEqual(hydrateCount, 10);
				assert.strictEqual(pool.totalObjects, 10);
				assert.strictEqual(pool.availableObjects, 10);
				assert.strictEqual(pool.usedObjects, 0);
			});
		});
	};

	runAllTests((onHydrate, onRelease, config) => new SlowPool(onHydrate, onRelease, config), 'SlowPool');
	runAllTests((onHydrate, onRelease, config) => new FastPool(onHydrate, onRelease, config), 'FastPool');
});