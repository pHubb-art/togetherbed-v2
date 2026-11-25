/**
 * Cart logic: add, change quantity, count and total.
 * A cart is a list of lines: { id, option, quantity }. Every function returns
 * a new cart and never changes the one passed in. Pure logic with no page code.
 */
const MAX_QUANTITY = 99;

const sameLine = (line, id, option) => line.id === id && line.option === option;

function cleanQuantity(quantity) {
  const whole = Math.floor(Number(quantity));
  return Number.isFinite(whole) ? Math.min(Math.max(whole, 0), MAX_QUANTITY) : 0;
}

/** Add a product in one option. Adding the same product and option again raises its quantity. */
export function addToCart(cart, id, option, quantity = 1) {
  const existing = cart.find(line => sameLine(line, id, option));
  if (!existing) return quantity > 0 ? [...cart, { id, option, quantity: cleanQuantity(quantity) }] : cart;
  return setQuantity(cart, id, option, existing.quantity + quantity);
}

/** Set a line's quantity. Zero or less removes the line. */
export function setQuantity(cart, id, option, quantity) {
  const next = cleanQuantity(quantity);
  if (next === 0) return cart.filter(line => !sameLine(line, id, option));
  return cart.map(line => sameLine(line, id, option) ? { ...line, quantity: next } : line);
}

/** How many items are in the cart, counting quantities. */
export function cartCount(cart) {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

/** The cart total from the product prices. Lines for unknown products count as zero. */
export function cartTotal(cart, products) {
  return cart.reduce((sum, line) => {
    const product = products.find(entry => entry.id === line.id);
    return sum + (product ? product.price * line.quantity : 0);
  }, 0);
}
