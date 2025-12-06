

import { useEffect } from 'react'
import './App.css'
import ContactForm from './components/ContactForm'

function App() {

  useEffect(() => {
      const sendHeight = () => {
        const height = document.body.scrollHeight
        console.log('send height',height);
        window.parent.postMessage({ type: "setIframeHeight", height }, "*")
      }

      sendHeight() // initial height
     
      
      window.addEventListener("resize", sendHeight) // update on resize

      return () => window.removeEventListener("resize", sendHeight)
    }, [])
  return (
    <>
      <ContactForm />
    </>
  )
}


export default App
