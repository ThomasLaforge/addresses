import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { useDebounce } from 'usehooks-ts'

const findPropositions = async (search: string) => { 
  const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${search}&type=housenumber&autocomplete=1`)
  return response.json()
}

function App() {
  const [addresses, setAddresses] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const debouncedValue = useDebounce<string>(search, 1000)
  const [propositions, setPropositions] = useState([])
  const [error, setError] = useState(null)
  const [isLoaded, setIsLoaded] = useState(true)

  useEffect(() => {
    fetch('http://localhost:1337/api/addresses')
      .then((response) => response.json())
      .then(({data}) => {
        const values = data.map( (a: any) => a.attributes.value);
        setAddresses(values)
        setIsLoaded(false)
      })
      .catch((error) => {
        setError(error.message)
        setIsLoaded(false)
      })
  }, [])

  useEffect(() => {
    if (debouncedValue.length > 2) {
      findPropositions(debouncedValue).then((data) => {
        setPropositions(data.features)
      })
    }
  }, [debouncedValue])

  const handleSendAddress = useCallback(async () => {
    fetch('http://localhost:1337/api/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({data : { value: search}})
    })
    .catch((error) => {
      console.error('Error:', error);
      setAddresses(addresses.filter((address) => address !== search))
    });
    setAddresses([...addresses, search])
    setSearch('')
  }, [search, addresses])

  const handlePropositionClick = useCallback((proposition: string) => {
    setSearch(proposition)
    setPropositions([])
  }, [])

  return (
    <>
      <div className="App">
        <div className="search-zone">
          <input type="text" onChange={(e) => setSearch(e.target.value)} placeholder="Search" value={search} />
          <div className="propositions">
            {propositions.map((proposition: any, index) => (
              <div key={index} onClick={() => handlePropositionClick(proposition.properties.label)}>{proposition.properties.label}</div>
            ))}
          </div>
          <button
            onClick={handleSendAddress}
          >Envoyer</button>
        </div>
        {isLoaded && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
        {addresses.length > 0 && 
          <div className="list-address">
            {addresses.map((address, index) => (
              <div key={index}>{address}</div>
              ))}
          </div>
        }
      </div>
    </>
  )
}

export default App
