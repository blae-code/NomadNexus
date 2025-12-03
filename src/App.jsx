import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import AppShell from './components/layout/AppShell';

function App() {
  return (
    <>
      <AppShell>
        <Pages />
      </AppShell>
      <Toaster />
    </>
  )
}

export default App 
