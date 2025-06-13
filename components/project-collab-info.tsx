import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ProjectCollabInfo() {
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Información sobre colaboración</AlertTitle>
      <AlertDescription>
        Para colaborar en este proyecto, comparte el enlace con otros usuarios. Cada colaborador necesitará iniciar
        sesión con su propia cuenta para acceder al proyecto.
      </AlertDescription>
    </Alert>
  )
}
