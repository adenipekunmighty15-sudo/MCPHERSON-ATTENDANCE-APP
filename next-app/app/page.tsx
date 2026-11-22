import type { Metadata } from 'next'
import LandingExperience from '@/components/landing/LandingExperience'

export const metadata: Metadata = {
  title: 'McPherson University | Student Portal',
  description: 'Courses, class times, attendance and study support in one clear place.',
}

export default function Home() {
  return <LandingExperience />
}
