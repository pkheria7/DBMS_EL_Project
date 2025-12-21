import React from 'react';
import { UserPlus, GraduationCap, Users, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const Signup = () => {
  const registrationOptions = [
    {
      title: 'Student Registration',
      description: 'Register as a student to form teams, collaborate on projects, and gain experiential learning experience.',
      icon: GraduationCap,
      href: '/register-student',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Faculty Registration',
      description: 'Register as a faculty member to mentor students, review projects, and guide innovative solutions.',
      icon: Users,
      href: '/register-faculty',
      color: 'from-indigo-500 to-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Create Your Account
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choose your role to get started with TeamSync
          </p>
        </div>

        {/* Registration Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {registrationOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <a
                key={index}
                href={option.href}
                className="group block"
              >
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:bg-slate-700 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer h-full">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${option.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {option.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    {option.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center space-x-2 text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-400">
            Already have an account?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
