import { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const IconComponent = (Icons as any)[icon] as LucideIcon
  return (
    <div className="flex flex-col items-center text-center p-6">
      {IconComponent && <IconComponent className="h-12 w-12 text-primary" />}
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  )
}
