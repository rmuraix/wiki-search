import { Route, Routes } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'
import SearchPage from '@/pages/SearchPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
