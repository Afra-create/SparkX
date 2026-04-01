import { useAuthStore } from '../store/authStore';
import { ShoppingBag, Search, ShieldCheck, MapPin, MessageCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { openAuthModal } = useAuthStore();

  const features = [
    {
      title: 'Peer Marketplace',
      desc: 'Buy and sell textbooks, electronics, and dorm essentials exclusively within the Jain College community.',
      icon: <ShoppingBag className="w-6 h-6" />,
      link: '/marketplace'
    },
    {
      title: 'Lost & Found',
      desc: 'Quickly report missing items or help reunite peers with their belongings using our campus-wide board.',
      icon: <Search className="w-6 h-6" />,
      link: '/lost-found'
    },
    {
      title: 'Secure Meetups',
      desc: 'Schedule safe exchanges at designated campus locations like the Library or Canteen.',
      icon: <ShieldCheck className="w-6 h-6" />,
      link: '/'
    }
  ];

  const steps = [
    { icon: <Search className="w-5 h-5"/>, title: 'Discover', desc: 'Browse trending items and fresh listings daily.' },
    { icon: <MessageCircle className="w-5 h-5"/>, title: 'Connect', desc: 'Chat instantly in real-time with verified peers.' },
    { icon: <Calendar className="w-5 h-5"/>, title: 'Exchange', desc: 'Plan a secure on-campus meetup easily.' },
    { icon: <MapPin className="w-5 h-5"/>, title: 'Recover', desc: 'Post and track lost valuables on the map.' }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 text-center min-h-[calc(100vh-100px)]">
        <h1 
          className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground sm:text-7xl md:text-8xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-muted-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>dreams</em> rise <br className="hidden sm:block" /><em className="not-italic text-muted-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>through the silence.</em>
        </h1>
        
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work exclusively for the Jain College ecosystem.
        </p>
        
        <button 
          onClick={openAuthModal}
          className="liquid-glass animate-fade-rise-delay-2 mt-12 cursor-pointer rounded-full px-14 py-5 font-medium text-base text-foreground transition-transform hover:scale-[1.03]"
        >
          Begin Journey
        </button>
      </section>

      {/* Features Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24 border-t border-white/10 bg-background/20 backdrop-blur-sm mt-12 rounded-t-[3rem]">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-foreground mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>Tools for the ecosystem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to navigate campus life efficiently, built into one seamless platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="liquid-glass p-8 rounded-3xl flex flex-col items-start text-left transition-transform hover:-translate-y-2 group">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-foreground mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-medium text-foreground mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-1">{feat.desc}</p>
                <Link to={feat.link} className="text-sm font-medium text-foreground border-b border-white/20 pb-1 hover:border-foreground transition-colors">
                  Explore {feat.title} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24 bg-background/40 backdrop-blur-md">
        <div className="max-w-7xl w-full">
           <div className="grid border border-white/10 rounded-3xl overflow-hidden md:grid-cols-2 lg:grid-cols-4 bg-white/5">
              {steps.map((step, idx) => (
                <div key={idx} className="p-8 border-b md:border-b-0 md:border-r border-white/10 last:border-0 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-foreground mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center border-t border-white/10 bg-background/20 backdrop-blur-sm rounded-b-[3rem] mb-12">
        <h2 className="text-5xl sm:text-7xl text-foreground mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>Ready to join?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">Connect with thousands of verified peers across the campus ecosystem today.</p>
        <button 
          onClick={openAuthModal}
          className="bg-foreground text-background px-10 py-4 rounded-full font-medium transition-transform hover:scale-[1.03] cursor-pointer"
        >
          Create Free Account
        </button>
      </section>
    </div>
  );
}
