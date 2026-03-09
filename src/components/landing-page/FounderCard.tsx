interface FounderCardProps {
  name: string
  title: string
  bio: string
  imageUrl?: string
}

export default function FounderCard({ name, title, bio, imageUrl }: FounderCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-24 w-24 rounded-full object-cover" />
      ) : (
        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">{name.charAt(0)}</span>
        </div>
      )}
      <h3 className="mt-4 text-xl font-semibold">{name}</h3>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-gray-600">{bio}</p>
    </div>
  )
}
