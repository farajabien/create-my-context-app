import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, Rocket, Github, Twitter, FileText, Brain, Code } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">MyContext</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Features
            </Button>
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
            <Button variant="ghost" size="sm">
              Docs
            </Button>
            <ThemeToggle />
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-autopy-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            ✨ Published to npm! create-my-context-app is now available
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Go from Idea to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Production-Ready App
            </span>{" "}
            in Minutes
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Instantly scaffold a Next.js app with best-practice architecture, AI-generated context, and a beautiful UI.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-8 font-mono text-sm">
            <span className="text-muted-foreground">$ </span>
            npx create-my-context-app --name my-app --generate --description "A SaaS for AI-driven project management."
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              See a Live Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Powered by Next.js, shadcn/ui, and the{" "}
            <a href="https://mycontext.fbien.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              @/_my_context Platform
            </a>{" "}
            • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-autopy-24">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">The Ultimate Project Scaffolding CLI</h2>
          <p className="text-xl text-muted-foreground">
            Run one command to get a production-ready Next.js codebase, complete with AI-generated context, UI components, and best-practice architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Instant Scaffolding CLI</CardTitle>
              <CardDescription>
                Bootstrap a production-ready Next.js app with a single command.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• One-command setup</li>
                <li>• Modern UI components</li>
                <li>• Best-practice architecture</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>AI-Powered Context</CardTitle>
              <CardDescription>
                Generate PRDs, user stories, and technical specs from a simple idea.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-model AI orchestration</li>
                <li>• Comprehensive documentation</li>
                <li>• Smart context generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Complete @/_my_context</CardTitle>
              <CardDescription>
                Get a full context package with PRDs, user stories, technical specs, and AI tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 11 files for full projects</li>
                <li>• 6 files for landing pages</li>
                <li>• AI-optimized prompts</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-autopy-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build your next project?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join developers using AI-powered context generation to build faster
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2">
              Start Building <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://mycontext.fbien.com/" target="_blank" rel="noopener noreferrer">
                Visit MyContext Platform
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-autopy-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-semibold">MyContext</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://github.com/farajabien/create-my-context-app" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 MyContext. Powered by{" "}
            <a href="https://mycontext.fbien.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              @/_my_context Platform
            </a>
            . All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 