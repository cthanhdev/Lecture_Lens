import { BrowserRouter } from 'react-router-dom'
import { NavigationProvider } from './router/NavigationContext.tsx'
import { AudioProvider } from './modules/audio/AudioContext.tsx'
import { AppRoutes } from './router/routes.tsx'
import { MobileContainer } from './layouts/MobileContainer.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <AudioProvider>
          <MobileContainer>
            <AppRoutes />
          </MobileContainer>
        </AudioProvider>
      </NavigationProvider>
    </BrowserRouter>
  )
}
