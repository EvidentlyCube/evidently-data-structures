import 'mocha';
import {assert} from 'chai';
import {FastPool} from "../src/FastPool";

describe("FastPool", () => {
	it("Should call hydrate as many times as initial size", () => {
		let hydrations = 0;
		const callback = () => {
			hydrations += 1;
			return {};
		};
		new FastPool(callback, undefined, {initialSize: 5});

		assert.strictEqual(hydrations, 5);
	});

	it("Should not hydrate when fetching as much elements as requested to have in initial size", () => {
		let hydrations = 0;
		const callback = () => {
			hydrations += 1;
			return {};
		};
		const pool = new FastPool(callback, undefined, {initialSize: 5});
		hydrations = 0;

		pool.getOne();
		pool.getOne();
		pool.getOne();
		pool.getOne();
		pool.getOne();

		assert.strictEqual(hydrations, 0);
	});

	it("Should not hydrate when fetching as much elements as requested to have in initial size", () => {
		let hydrations = 0;
		const callback = () => {
			hydrations += 1;
			return {};
		};
		const pool = new FastPool(callback, undefined, {initialSize: 5});
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
		const pool = new FastPool(callback, undefined, {initialSize: 5, autoHydrateSize: 3});
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
		const pool = new FastPool(() => hydrateWith, undefined, {initialSize: 1});

		assert.strictEqual(pool.getOne(), hydrateWith);
	});

	it("Should release the hydrated object back to pool and fetch it again without hydration", () => {
		let hydrations = 0;
		const hydrateWith = {};
		const callback = () => {
			hydrations++;
			return hydrateWith;
		};
		const pool = new FastPool(callback, undefined, {initialSize: 1});

		const returnedFromPool = pool.getOne();
		pool.release(returnedFromPool);
		assert.strictEqual(pool.getOne(), hydrateWith);
		assert.strictEqual(hydrations, 1);
	});

	it("Should call release callback on hydration", () => {
		let releasedWith: any;
		const hydrateWith = {};
		const pool = new FastPool(() => hydrateWith, item => releasedWith = item, {initialSize: 1});

		pool.release(pool.getOne());
		assert.strictEqual(releasedWith, hydrateWith);
	})
});