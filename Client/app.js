const form = document.getElementById('getPokemonAPI')
const nameForm = document.getElementById('name')

const displayName = document.getElementById('displayName')
const displayType = document.getElementById('displayType')

const addPokeForm = document.getElementById('addPokemons')
const addPokemon = document.getElementById('pokemonName')

form.addEventListener('submit', function(e){
    e.preventDefault();
    fetch(`/get-pokemon?name=${nameForm.value}`).then(res => res.json()).then(data => {
        if (data.success) {
            displayName.innerText = data.pokemon.name.english;
            displayType.innerText = data.pokemon.type.join(', ')
            return;
        }
        alert("Who's that Pokemon?! Try searching Pokedex!")

    }).catch(err => {
        console.log(err)
    })
})

addPokeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    fetch(`/add-pokemon?name=${addPokemon.value}`).then(res => res.json()).then(data => {
        if (data.success) {
            alert("Who's that Pokemon?! Try searching your Pokedex!")
            return;
        }


    }).catch(err => {
        console.log(err)
    })
})




