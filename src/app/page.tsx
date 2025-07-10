import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Camera, Scale, Heart, Moon, TrendingUp, ArrowRight, Sparkles, Target, Users } from "lucide-react"
import { WeightProgressChart, CalorieIntakeChart, MoodSleepChart } from "@/components/dashboard-preview"

/**
 * Displays the main landing page for the AI Fitness Coach app, featuring navigation, hero section with dashboard previews, feature highlights, value proposition, call to action, and footer.
 *
 * Presents a multi-section, responsive layout introducing the app’s capabilities, benefits, and community focus using custom UI components, charts, and icons.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">AI Fitness Coach</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
                About
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900 transition-colors">
                Profile
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Button asChild>
                <Link href="https://github.com/edgarcerecerez/ai-fitness-coach" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Star on GitHub</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/ai-health-training-app.png')"
        }}
      >
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Fitness Coaching
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Personal AI Fitness Coach for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Real Results
            </span>
          </h1>
          <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your health journey with intelligent recommendations that adapt to your lifestyle. Track weight,
            calories, sleep, and mood while our AI provides personalized guidance for sustainable success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-slate-900 hover:bg-slate-100" asChild>
              <Link href="/login">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Your AI Fitness Dashboard</h3>
                <p className="text-sm text-slate-600">Live preview of your personalized insights</p>
              </div>

              {/* Big component on top - Weight Progress Chart */}
              <div className="mb-6">
                <WeightProgressChart />
              </div>

              {/* Two small components on bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CalorieIntakeChart />
                <MoodSleepChart />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need for Success</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our holistic approach combines cutting-edge AI with comprehensive health tracking to deliver personalized
              recommendations that actually work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Calorie Tracking</h3>
                <p className="text-slate-600">
                  Simply take a photo of your meal and our AI instantly estimates calories and nutritional content. No
                  more tedious manual logging.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Seamless Weight Tracking</h3>
                <p className="text-slate-600">
                  Connect your smart scale or Apple HealthKit for automatic weight tracking with intelligent trend
                  analysis and progress visualization.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Insights</h3>
                <p className="text-slate-600">
                  Get personalized recommendations based on your weight, nutrition, sleep, and mood patterns. Your AI
                  coach learns what works for you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Holistic Health Tracking</h3>
                <p className="text-slate-600">
                  Track mood, stress levels, and life events alongside physical metrics for a complete picture of your
                  health journey.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Moon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Sleep Integration</h3>
                <p className="text-slate-600">
                  Monitor sleep patterns and receive recommendations that consider your rest quality for optimal
                  recovery and performance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Progress Analytics</h3>
                <p className="text-slate-600">
                  Visualize your progress with intelligent analytics that highlight trends, celebrate milestones, and
                  keep you motivated.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Target className="w-4 h-4 mr-2" />
                Your Success First
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Built for Real People, Real Results
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Unlike other fitness apps focused on monetization, we&apos;re committed to your genuine success. Our AI
                analyzes your unique patterns and provides actionable insights that fit your lifestyle.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-slate-700">Personalized recommendations that evolve with you</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-slate-700">Minimal friction tracking with maximum insights</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-slate-700">Focus on sustainable habits, not quick fixes</span>
                </li>
              </ul>
              <Button size="lg" asChild>
                <Link href="/about">
                  Learn More About Our Mission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <Image
                  src="/placeholder.svg?height=500&width=600"
                  alt="AI Fitness Coach Features"
                  width={600}
                  height={500}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-slate-800 text-slate-200">
            <Users className="w-4 h-4 mr-2" />
            Open Source & Community Driven
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Health Journey?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join our community of health-focused individuals and start building sustainable habits with the power of AI
            coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-slate-900 hover:bg-slate-100" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-slate-600 text-slate-300 hover:bg-slate-800"
              asChild
            >
              <Link href="/contribute">Contribute to the Project</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI Fitness Coach</span>
              </div>
              <p className="text-slate-400">
                Your personal AI-powered fitness companion for sustainable health and wellness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contribute" className="hover:text-white transition-colors">
                    Contribute
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 AI Fitness Coach. Open source and built with ❤️ for your success.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
