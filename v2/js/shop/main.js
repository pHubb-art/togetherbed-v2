/**
 * PureCare shop page: product grid, add to cart, and a cart summary with
 * quantity, remove and a sample total. The cart is kept in session storage.
 * There is no checkout. All visible words come from data/copy.json.
 */
import { loadJson } from "../shared/load-json.js";
import { saveState, readState } from "../shared/storage.js";
import { fillTemplate } from "../shared/fill-template.js";
import { addToCart, setQuantity, cartCount, cartTotal } from "./cart.js";

const app = document.getElementById("shop-app");
const cartLink = document.getElementById("cart-link");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
let copy, products, cart = [];
let toastTimer;

const escapeHtml = text => String(text ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const productById = id => products.find(product => product.id === id);

/** The saved cart, keeping only lines that still match a product and one of its options. */
function savedCart() {
  const saved = readState("cart", []);
  if (!Array.isArray(saved)) return [];
  return saved.filter(line => productById(line?.id)?.options.includes(line.option) && line.quantity > 0);
}

function productCard(product) {
  const text = copy.shop;
  const options = product.options.map(option => `<option>${escapeHtml(option)}</option>`).join("");
  return `
    <li class="card sq product-card">
      <div class="placeholder sq product-image" data-swatch="${escapeHtml(product.swatch)}" aria-hidden="true"><span class="placeholder-tag">${escapeHtml(text.imageTag)}</span></div>
      <span class="pill">${escapeHtml(product.tag)}</span>
      <h2>${escapeHtml(product.name)}</h2>
      <p class="muted">${escapeHtml(product.body)}</p>
      <p class="product-price"><span class="muted">${escapeHtml(text.samplePrice)}</span> <strong class="num">${escapeHtml(money.format(product.price))}</strong></p>
      <div class="field">
        <label for="option-${escapeHtml(product.id)}">${escapeHtml(text.optionLabel)}</label>
        <select id="option-${escapeHtml(product.id)}" class="sq">${options}</select>
      </div>
      <button class="btn btn-accent sq" type="button" data-action="add" data-product="${escapeHtml(product.id)}">${escapeHtml(text.addCta)}</button>
    </li>`;
}

function cartLine(line, index) {
  const text = copy.shop;
  const product = productById(line.id);
  const names = { product: product.name, option: line.option };
  return `
    <li class="cart-line">
      <p class="cart-line-name"><strong>${escapeHtml(product.name)}</strong><br><span class="muted">${escapeHtml(line.option)}</span></p>
      <div class="field cart-quantity">
        <label class="visually-hidden" for="quantity-${index}">${escapeHtml(fillTemplate(text.quantityLabel, names))}</label>
        <input id="quantity-${index}" class="sq" type="number" inputmode="numeric" min="0" max="99" step="1" value="${line.quantity}" data-line="${index}">
      </div>
      <p class="num cart-line-price">${escapeHtml(money.format(product.price * line.quantity))}</p>
      <button class="btn btn-quiet btn-small sq" type="button" data-action="remove" data-line="${index}" aria-label="${escapeHtml(fillTemplate(text.removeLabel, names))}">${escapeHtml(text.removeCta)}</button>
    </li>`;
}

function cartHtml() {
  const text = copy.shop;
  const lines = cart.length
    ? `<ul class="cart-lines">${cart.map(cartLine).join("")}</ul>`
    : `<p class="muted">${escapeHtml(text.cartEmpty)}</p>`;
  return `
    ${lines}
    <p class="muted">${escapeHtml(fillTemplate(text.itemCount, { count: cartCount(cart) }))}</p>
    <p class="cart-total"><span>${escapeHtml(text.totalLabel)}</span> <strong class="num">${escapeHtml(money.format(cartTotal(cart, products)))}</strong></p>
    <button class="btn sq" type="button" disabled aria-describedby="checkout-note">${escapeHtml(text.checkoutCta)}</button>
    <p id="checkout-note" class="field-hint">${escapeHtml(text.checkoutNote)}</p>`;
}

function pageHtml() {
  const text = copy.shop;
  return `
    <h1 tabindex="-1">${escapeHtml(text.headline)}</h1>
    <p class="lede">${escapeHtml(text.body)}</p>
    <p class="pill pill-honey">${escapeHtml(text.samplePriceNote)}</p>
    <div class="shop-layout">
      <ul class="product-grid" aria-label="${escapeHtml(text.productsLabel)}">${products.map(productCard).join("")}</ul>
      <section id="cart" class="card sq cart" aria-labelledby="cart-heading">
        <h2 id="cart-heading" tabindex="-1">${escapeHtml(text.cartHeadline)}</h2>
        <div id="cart-body">${cartHtml()}</div>
      </section>
    </div>`;
}

function updateCartLink() {
  cartLink.textContent = fillTemplate(copy.shop.cartLink, { count: cartCount(cart) });
  cartLink.hidden = false;
}

/** Save and redraw the cart. focusLine keeps focus on that line's quantity box when it is still there. */
function changeCart(nextCart, { focusLine = null } = {}) {
  cart = nextCart;
  saveState("cart", cart);
  document.getElementById("cart-body").innerHTML = cartHtml();
  updateCartLink();
  const input = focusLine === null ? null : document.getElementById(`quantity-${focusLine}`);
  if (input) input.focus();
  else if (focusLine !== null) document.getElementById("cart-heading").focus();
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast sq";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

const ACTIONS = {
  add: button => {
    const id = button.dataset.product;
    const option = document.getElementById(`option-${id}`).value;
    changeCart(addToCart(cart, id, option));
    showToast(copy.shop.added);
  },
  remove: button => {
    const line = cart[Number(button.dataset.line)];
    if (!line) return;
    changeCart(setQuantity(cart, line.id, line.option, 0), { focusLine: -1 });
    showToast(copy.shop.removed);
  }
};

app.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (button && ACTIONS[button.dataset.action]) ACTIONS[button.dataset.action](button);
});

app.addEventListener("change", event => {
  const index = event.target.dataset.line;
  if (event.target.type !== "number" || index === undefined) return;
  const line = cart[Number(index)];
  if (!line || event.target.value === "") return;
  const nextCart = setQuantity(cart, line.id, line.option, event.target.value);
  changeCart(nextCart, { focusLine: nextCart.length < cart.length ? -1 : Number(index) });
});

async function start() {
  try {
    [copy, { products }] = await Promise.all([loadJson("data/copy.json"), loadJson("data/products.json")]);
  } catch (error) {
    app.textContent = "The shop could not load. Please refresh the page.";
    return;
  }
  cart = savedCart();
  app.innerHTML = pageHtml();
  updateCartLink();
}

start();
