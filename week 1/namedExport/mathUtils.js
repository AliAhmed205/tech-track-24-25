// Write a module that exports two functions, a square function with an argunment number and an average number that takes multiple numbers.

function square(x) {
  return x * x; 
}

function average(x, y, z) {
  return (x + y + z) / 3 
}

// Export the functions using named exports.
export { square, average}
