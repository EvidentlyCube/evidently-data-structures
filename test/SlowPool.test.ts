import 'mocha';
import {assert} from 'chai';
import {SlowPool} from "../src/SlowPool";

describe("SlowPool", () => {
	it("Should error when hydration returns an instance that's already in the pool", () => {
		const hydrateWith = {};

		assert.throws(() => new SlowPool(() => hydrateWith, undefined, {initialSize: 5}));
	});

	it("Should error when releasing to a pool an object that is already in the pool", () => {
		const hydrateWith = {};
		const pool = new SlowPool(() => hydrateWith, undefined, {initialSize: 1});

		assert.throws(() => pool.release(hydrateWith));
	});

	it("Should error when releasing to a pool an object that was not hydrated into it", () => {
		const hydrateWith = {};
		const pool = new SlowPool(() => hydrateWith, undefined, {initialSize: 1});

		assert.throws(() => pool.release(hydrateWith));
	});
});