function add(a, b) {
  return a - b; // BUG: Should be +
}
console.log("2 + 2 =", add(2, 2));
