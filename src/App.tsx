import { lazy, Suspense } from 'react'

import { Landing } from '@/app/landing'
import { useHashRoute } from '@/lib/use-hash-route'

/* each surface loads only when opened */
const PatientApp = lazy(() => import('@/app/patient/patient-app').then((m) => ({ default: m.PatientApp })))
const ConsoleApp = lazy(() => import('@/app/console/console-app').then((m) => ({ default: m.ConsoleApp })))

export function App() {
  const route = useHashRoute()
  return (
    <Suspense fallback={<div className="h-full bg-canvas" />}>
      {route.startsWith('app') ? (
        <PatientApp />
      ) : route.startsWith('console') ? (
        <ConsoleApp route={route.replace(/^console\/?/, '')} />
      ) : (
        <Landing />
      )}
    </Suspense>
  )
}
