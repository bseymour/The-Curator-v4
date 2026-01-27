import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Users, 
  Building2, 
  ListTodo, 
  MessageSquare,
  TrendingUp,
  Shield,
  Settings,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Clock,
  Search,
  Layers,
  Target
} from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: Users,
      title: 'Team Insights',
      description: 'Monitor individual team member activity, sentiment, and communication patterns. Identify early warning signs and prepare for 1:1s with AI-generated talking points.',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: Building2,
      title: 'Company Insights',
      description: 'Summarize channel activity across your organization. Filter by action items vs informational updates, and track key decisions and discussions.',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: ListTodo,
      title: 'To-Do Management',
      description: 'Capture action items directly from insights with one click. Track follow-ups, mark items complete, and never lose track of commitments.',
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      icon: Layers,
      title: 'Custom Groupings',
      description: 'Create your own team groups and channel categories. Organize insights by function, project, or any structure that fits your workflow.',
      color: 'text-amber-600 bg-amber-100',
    },
    {
      icon: TrendingUp,
      title: 'Sentiment Analysis',
      description: 'Detect positive, negative, or mixed sentiment in communications. Identify patterns and address concerns before they escalate.',
      color: 'text-rose-600 bg-rose-100',
    },
    {
      icon: MessageSquare,
      title: 'Slack Deep Links',
      description: 'Every insight links back to the original Slack message. Click through for full context without losing your place.',
      color: 'text-cyan-600 bg-cyan-100',
    },
  ]

  const steps = [
    {
      number: '1',
      title: 'Configure Settings',
      description: 'Start by setting up your channel categories and team groups in Settings. This helps organize your insights.',
      link: '/settings',
      linkText: 'Go to Settings',
    },
    {
      number: '2',
      title: 'Add Channels',
      description: 'Search for and add the Slack channels you want to monitor. Assign them to categories for better organization.',
      link: '/settings',
      linkText: 'Add Channels',
    },
    {
      number: '3',
      title: 'Add Team Members',
      description: 'Add the team members you want to track. Set their role (IC/Manager) and relationship to you.',
      link: '/settings',
      linkText: 'Add Team Members',
    },
    {
      number: '4',
      title: 'Generate Insights',
      description: 'Visit Team or Company pages and click "Generate" to get AI-powered summaries and analysis.',
      link: '/team',
      linkText: 'View Team Insights',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium">
            <Zap className="h-4 w-4 mr-2 text-primary" />
            About The Curator
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Your AI-Powered Slack Intelligence Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The Curator helps engineering managers stay connected with their teams by providing 
            AI-powered insights from Slack communications—without the overwhelm of reading every message.
          </p>
        </div>

        {/* Purpose Section */}
        <Card className="mb-12 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="h-6 w-6 text-primary" />
              Why The Curator?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              As a manager, staying informed about your team's work is crucial—but reading every Slack 
              message is impossible. The Curator bridges this gap by analyzing your team's communications 
              and surfacing what matters most.
            </p>
            <div className="grid md:grid-cols-3 gap-6 pt-4">
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Save Time</h4>
                <p className="text-sm">Get caught up in minutes, not hours of scrolling through channels</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Stay Informed</h4>
                <p className="text-sm">Never miss important decisions, blockers, or team sentiment shifts</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Take Action</h4>
                <p className="text-sm">Track action items and follow-ups so nothing falls through the cracks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Getting Started</h2>
            <p className="text-muted-foreground">Set up The Curator in just a few steps</p>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.number} className="overflow-hidden">
                <div className="flex items-stretch">
                  <div className="flex items-center justify-center w-16 bg-primary/10 text-primary font-bold text-2xl">
                    {step.number}
                  </div>
                  <div className="flex-1 p-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0 bg-transparent">
                      <Link href={step.link}>
                        {step.linkText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">How to Use</h2>
            <p className="text-muted-foreground">Make the most of The Curator</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Use Team Insights to prepare for 1:1s and stay aware of team dynamics:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Filter by team groups to focus on specific sub-teams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Click "Generate Summary" on individual cards for deep dives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Review suggested 1:1 topics before meetings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Watch for sentiment trends that might need attention</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Company Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Use Company Insights for a bird's eye view of organizational activity:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Filter by "Actions" to see items requiring follow-up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Filter by "Info" for FYI updates and decisions made</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Add action items to your To-Do list with one click</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Click "View in Slack" to see the full context</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  To-Do Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Use To-Dos to track and complete action items:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Add items from Company Insights or manually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Click the checkbox to mark items complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Filter by Active/Completed to focus your view</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Use "Clear Completed" to clean up finished items</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Time Ranges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Choose the right time range for your analysis:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>24 hours:</strong> Daily check-in or urgent catch-up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>7 days:</strong> Weekly review (recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>14/30 days:</strong> Deeper analysis or returning from time off</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Specific week:</strong> Historical review for retrospectives</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Features</h2>
            <p className="text-muted-foreground">Everything you need to stay connected with your team</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="h-full">
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${feature.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Privacy Section */}
        <Card className="mb-12 border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>The Curator is designed with privacy in mind:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Only accesses channels that your Slack user can see</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>No message content is stored permanently—only used for real-time analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Configuration stored in your own Upstash Redis instance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>AI processing happens through Vercel's secure AI Gateway</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/settings">
                <Settings className="h-5 w-5 mr-2" />
                Configure Settings
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/">
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
