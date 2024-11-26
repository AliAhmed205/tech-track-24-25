<script>
  import { onMount } from "svelte";

  onMount(() =>{
    const removeBtn = document.querySelector('.backdrop-container .intro-container button')
    const introBg = document.querySelector('.backdrop-container')

    removeBtn.addEventListener('click', ()=>{
      introBg.remove()
    })
    
  })
</script>

<section class="backdrop-container">
  <section class="intro-container">
  <h2><i class="fa-solid fa-sun"></i> Rythm of The Sun</h2>
  <p>
    Welcome to the <b>Rythm of The Sun</b> visualisation. A real-time visualisation
    of the sun, shining on the earth. Experiment by changing the months of by going
    forward in time through the hours.
  </p>
  <button type="button">Start</button>
</section>
</section>
