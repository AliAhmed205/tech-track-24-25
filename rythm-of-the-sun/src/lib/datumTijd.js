export let selectedDate = new Date(); 
export let selectedTime = selectedDate.toTimeString().slice(0, 5); 

export function updateSelectedDate(event) {
  selectedDate = new Date(event.target.value);
  updateSunAndNight();
}

export function updateSelectedTime(event, updateSunAndNight) {
  selectedTime = event.target.value;  
  updateSunAndNight();  
}
