import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { addToCart, setQuantity, cartTotal, cartCount } from "../js/shop/cart.js";

const { products } = JSON.parse(fs.readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
const priceOf = id => products.find(product => product.id === id).price;

test("adding the same product and option twice raises the quantity", () => {
  let cart = addToCart([], "fit-pillow", "Mid loft");
  cart = addToCart(cart, "fit-pillow", "Mid loft");
  assert.deepEqual(cart, [{ id: "fit-pillow", option: "Mid loft", quantity: 2 }]);
});

test("a different option is its own line", () => {
  const cart = addToCart(addToCart([], "cool-sheets", "Queen"), "cool-sheets", "King");
  assert.equal(cart.length, 2);
});

test("adding never changes the cart passed in", () => {
  const cart = addToCart([], "protector", "King");
  addToCart(cart, "protector", "King");
  assert.equal(cart[0].quantity, 1);
});

test("count and total add up every line", () => {
  let cart = addToCart([], "fit-pillow", "Low loft", 2);
  cart = addToCart(cart, "cool-sheets", "Queen");
  assert.equal(cartCount(cart), 3);
  assert.equal(cartTotal(cart, products), priceOf("fit-pillow") * 2 + priceOf("cool-sheets"));
  assert.equal(cartTotal([], products), 0);
  assert.equal(cartCount([]), 0);
});

test("setting a quantity changes only that line", () => {
  let cart = addToCart(addToCart([], "fit-pillow", "Low loft"), "protector", "Queen");
  cart = setQuantity(cart, "protector", "Queen", 4);
  assert.deepEqual(cart.map(line => line.quantity), [1, 4]);
  assert.equal(cartTotal(cart, products), priceOf("fit-pillow") + priceOf("protector") * 4);
});

test("a quantity of zero or less removes the line", () => {
  const cart = addToCart(addToCart([], "fit-pillow", "Low loft"), "protector", "Queen");
  assert.deepEqual(setQuantity(cart, "protector", "Queen", 0).map(line => line.id), ["fit-pillow"]);
  assert.deepEqual(setQuantity(cart, "protector", "Queen", -3).map(line => line.id), ["fit-pillow"]);
});

test("quantities are whole numbers within limits", () => {
  const cart = addToCart([], "pillow-pair", "Matched from Sleep Fit");
  assert.equal(setQuantity(cart, "pillow-pair", "Matched from Sleep Fit", "2.7")[0].quantity, 2);
  assert.equal(setQuantity(cart, "pillow-pair", "Matched from Sleep Fit", 500)[0].quantity, 99);
  assert.deepEqual(setQuantity(cart, "pillow-pair", "Matched from Sleep Fit", "abc"), []);
});

test("lines for unknown products count toward the total as zero", () => {
  assert.equal(cartTotal([{ id: "gone", option: "x", quantity: 2 }], products), 0);
});
