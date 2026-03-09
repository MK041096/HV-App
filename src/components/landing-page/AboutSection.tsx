import { about } from "@/data/landing-page/content"
import { team } from "@/data/landing-page/team"
import FounderCard from "./FounderCard"

export default function AboutSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center">{about.title}</h2>
        <p className="mt-4 text-center text-gray-600">{about.description}</p>
        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2">
          {team.map((member) => (
            <FounderCard
              key={member.id}
              name={member.name}
              title={member.title}
              bio={member.bio}
              imageUrl={member.imageUrl}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
