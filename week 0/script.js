// Excercise 1

const bodyEl = document.querySelector('body')
const data = ['Ali', 'Beau', 'Kevin', 'Demi']

let namen = " "

data.forEach(student => {
  namen += student + " "
})

const studentName = document.createElement('h1')


studentName.textContent = namen.trim()  
bodyEl.appendChild(studentName)

// Excercise 2 

const dataTwo = [1, 2, "3", "4", 5]

const converter = dataTwo.map(item => Number(item))

console.log(converter)

// Excercise 3 

const dataThree = ["robert", "vincent", "lAuRa", "Danny", "bERRY", "rOOs"]

function firstLetter(names) { 
  return names.map(name => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  })
}

const result = firstLetter(data) 

console.log(result)

// Excercise 4 

const dataFour = [
  { name: "robert", age: "29", residence: "amsterdam", curriculum: ["Deloitte", "Hogeschool van Amsterdam", "DEPT"] },
  { name: "berend", age: "32", residence: "rotterdam", curriculum: ["DEPT", "GRRR"] },
  { name: "ubaida", age: "26", residence: "Amersfoort", curriculum: ["Clarify"] }
]

function nameAndJobs(array) {
  return array.map(person => {
    const name = person.name.charAt(0).toUpperCase() + person.name.slice(1).toLowerCase()

    const age = Number(person.age)

    let employer
    if (person.curriculum.length > 1) {
      employer = person.curriculum[1]
    } else if (person.curriculum.length === 1) {
      employer = person.curriculum[0]
    } else {
      employer = "Unknown"
    }
    return { name, age, employer }
  })
}

const newData = nameAndJobs(dataFour)

console.log(newData)


