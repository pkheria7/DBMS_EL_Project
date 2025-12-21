import React from 'react';
import { Users, FolderKanban, Archive, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const Home = () => {
  const features = [
    {
      icon: Users,
      title: 'Form Teams',
      description: 'Collaborate with students from your cluster. Find teammates with complementary skills and shared interests.',
      color: 'from-blue-500 to-cyan-500',
      href: '/form-team'
    },
    {
      icon: FolderKanban,
      title: 'Submit Projects',
      description: 'Present your innovative ideas. Submit comprehensive project proposals with clear objectives and timelines.',
      color: 'from-indigo-500 to-blue-600',
      href: '/submit-project'
    },
    {
      icon: Archive,
      title: 'Archives',
      description: 'Browse through completed projects and learn from past innovations and successful implementations.',
      color: 'from-slate-500 to-slate-600',
      href: '/archives'
    }
  ];

  const stats = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Hero Content */}
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-700 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Experiential Learning Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                TeamSync
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              Form Teams · Submit EL Projects · Get Approved
            </p>
            
            <p className="text-base text-slate-400 mb-12 max-w-2xl mx-auto">
              The complete platform for managing experiential learning projects. Collaborate, innovate, and bring your ideas to life with faculty mentorship.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/login"
                className="group inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Login</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/signup"
                className="inline-flex items-center space-x-2 bg-slate-800 text-slate-200 px-8 py-4 rounded-xl font-semibold hover:bg-slate-700 transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600"
              >
                <span>Register Student</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              A comprehensive platform designed to streamline your experiential learning journey from team formation to project completion.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <a
                  key={index}
                  href={feature.href}
                  className="group relative bg-slate-700 rounded-2xl p-8 hover:bg-slate-600 transition-all duration-300 border border-slate-600 hover:border-blue-500 hover:shadow-xl cursor-pointer block no-underline"
                >
                  {/* Icon with gradient background */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of students already collaborating on innovative projects
          </p>
          <a
            href="/signup"
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">TeamSync</span>
          </div>
          <p className="text-sm">
            © 2025 TeamSync. Empowering experiential learning.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
