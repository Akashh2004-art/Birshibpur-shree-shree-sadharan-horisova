import { useState } from 'react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  description: string;
}

interface Developer {
  id: number;
  name: string;
  role: string;
  image: string;
  description: string;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    facebook?: string;
    instagram?: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "পণ্ডিত রমেশ চন্দ্র ভট্টাচার্য",
    role: "প্রধান পুরোহিত",
    image: "/assets/image/temple.jpg",
    description: "৩০ বছরের অভিজ্ঞতা সম্পন্ন পুরোহিত, বিশেষজ্ঞ পূজা-অর্চনায়"
  },
  {
    id: 2,
    name: "শ্রী শম্ভুচরণ বসু",
    role: "সভাপতি",
    image: "/assets/image/temple.jpg",
    description: "মন্দির পরিচালনা কমিটির সভাপতি, ২০ বছর ধরে সেবারত"
  },
  {
    id: 3,
    name: "ধনঞ্জয় গোঁড়া",
    role: "সম্পাদক",
    image: "/assets/image/temple.jpg",
    description: "মন্দির উন্নয়ন ও সংস্কার কার্যক্রমের প্রধান সমন্বয়ক"
  },
  {
    id: 4,
    name: "শ্রী রঘুনাথ মিদ্দে",
    role: "সহ-সভাপতি",
    image: "/assets/image/temple.jpg",
    description: "মন্দির কার্যক্রম পরিচালনায় সহায়ক ভূমিকা পালনকারী"
  },
  {
    id: 5,
    name: "রাধানাথ সামন্ত",
    role: "সহ-সভাপতি",
    image: "/assets/image/temple.jpg",
    description: "ধর্মীয় অনুষ্ঠান আয়োজনে দক্ষ সংগঠক"
  },
  {
    id: 6,
    name: "সুকুমার গোঁড়া",
    role: "সহ-সভাপতি",
    image: "/assets/image/temple.jpg",
    description: "মন্দির রক্ষণাবেক্ষণ ও উন্নয়ন কাজে নিয়োজিত"
  },
  {
    id: 7,
    name: "জগদীশ মিদ্দে",
    role: "সহ-সম্পাদক",
    image: "/assets/image/temple.jpg",
    description: "আর্থিক ব্যবস্থাপনা ও হিসাব রক্ষণে পারদর্শী"
  },
  {
    id: 8,
    name: "তরুণ মন্ডল",
    role: "সহ-সম্পাদক",
    image: "/assets/image/temple.jpg",
    description: "যুব সমাজের সাথে সংযোগ স্থাপনে অগ্রণী ভূমিকা"
  },
  {
    id: 9,
    name: "প্রভাস মন্ডল",
    role: "সহ-সম্পাদক",
    image: "/assets/image/temple.jpg",
    description: "সামাজিক কার্যক্রম ও সেবামূলক কাজে নিবেদিতপ্রাণ"
  }
];

const developers: Developer[] = [
  {
    id: 1,
    name: "Mr. Akash Kr Saha",
    role: "Full Stack Web Developer",
    image: "/assets/image/akash.jpg",
    description: "The sole developer of this project.",
    links: {
      github: "https://github.com/Akashh2004-art",
      facebook: "https://www.facebook.com/profile.php?id=100037460886214",
      instagram: "https://www.instagram.com/iiam_akashh/"
    }
  }
];

const About = () => {
  const [selectedTab, setSelectedTab] = useState<'history' | 'mission' | 'team' | 'developers'>('history');

  const getRoleColor = (role: string) => {
    if (role.includes('প্রধান')) return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    if (role.includes('সভাপতি')) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (role.includes('সম্পাদক')) return 'bg-gradient-to-r from-green-500 to-teal-500';
    return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-300 opacity-15 rounded-full animate-ping"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fadeInUp">
              আমাদের সম্পর্কে জানুন
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-300">
              ১৪২ বছর ধরে ধর্মীয় সেবায় নিয়োজিত বীরশিপুর সাধারণ হরিসভা
            </p>
            
            {/* Decorative elements */}
            <div className="flex justify-center mt-8 space-x-4">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="container mx-auto px-4">
          <nav className="flex justify-center overflow-x-auto">
            {[
              { key: 'history', label: 'ইতিহাস', icon: '📜' },
              { key: 'mission', label: 'লক্ষ্য ও উদ্দেশ্য', icon: '🎯' },
              { key: 'team', label: 'পরিচালনা পর্ষদ', icon: '👥' },
              { key: 'developers', label: 'ডেভেলপার', icon: '💻' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`py-4 px-6 text-sm font-medium border-b-3 whitespace-nowrap transition-all duration-300 flex items-center space-x-2 ${
                  selectedTab === tab.key
                    ? 'border-orange-500 text-orange-500 bg-orange-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-16">
        {selectedTab === 'history' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">মন্দিরের ইতিহাস</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-4 text-lg">১৮৮৩ সাল থেকে আজ পর্যন্ত আমাদের গৌরবময় যাত্রা</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-orange-100 rounded-full mr-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">প্রতিষ্ঠার সূচনা</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  বীরশিপুর সাধারণ হরিসভা আজ থেকে প্রায় ১৪২ বছর পূর্বে প্রতিষ্ঠিত হয়। তৎকালীন সময়ে গ্রামে ভয়াবহ কলেরা মহামারী দেখা দিলে এক জটাধারী মহাসাধু আগমন করেন।
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">হরিনাম মহোৎসব</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  মহাসাধু গ্রামবাসীদের দুর্ভোগ থেকে মুক্তি কামনায় হরিনাম মহোৎসব আয়োজনের নির্দেশ দেন। সেই থেকেই এই মহোৎসবের শুভসূচনা হয়।
                </p>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">
              <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">মহোৎসবের কর্মসূচি</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { day: 'বৃহস্পতিবার', event: 'মহোৎসবের অধিবাস', icon: '🎭', color: 'from-purple-400 to-pink-400' },
                  { day: 'শুক্রবার রাত্রি', event: 'হরিনাম লীলা কীর্তন', icon: '🎵', color: 'from-blue-400 to-cyan-400' },
                  { day: 'শনিবার', event: 'সারাদিন মহানাম সংকীর্তন', icon: '🎊', color: 'from-green-400 to-teal-400' },
                  { day: 'রবিবার', event: 'ভোগ আরাধনা অনুষ্ঠান', icon: '🍽️', color: 'from-orange-400 to-red-400' },
                  { day: 'সোমবার ভোরে', event: 'মাঙ্গলিক কর্ম ও ভোগ বিতরণ', icon: '🙏', color: 'from-yellow-400 to-orange-400' }
                ].map((item, index) => (
                  <div key={index} className="text-center group">
                    <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">{item.day}</h4>
                    <p className="text-sm text-gray-600">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl text-white p-8 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-4xl font-bold mb-2">১০,০০০+</h3>
                  <p className="text-xl">মালসা ভোগ</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold mb-2">১৪২</h3>
                  <p className="text-xl">বছরের ইতিহাস</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold mb-2">হাজারো</h3>
                  <p className="text-xl">ভক্ত ও দর্শনার্থী</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'mission' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-4 text-lg">সমাজের কল্যাণে আমাদের অঙ্গীকার</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'ধর্মীয় শিক্ষা প্রসার',
                  description: 'নতুন প্রজন্মের মধ্যে ধর্মীয় শিক্ষা ও সনাতন হিন্দু ধর্মের মূল্যবোধ প্রসার করা।',
                  icon: '📚',
                  gradient: 'from-blue-500 to-purple-500'
                },
                {
                  title: 'সামাজিক সেবা',
                  description: 'দরিদ্র ও অসহায় মানুষের সেবা, শিক্ষা প্রতিষ্ঠান পরিচালনা, এবং সামাজিক উন্নয়নে অবদান রাখা।',
                  icon: '❤️',
                  gradient: 'from-red-500 to-pink-500'
                },
                {
                  title: 'সাংস্কৃতিক ঐতিহ্য সংরক্ষণ',
                  description: 'বাংলার সনাতন ধর্মীয় ও সাংস্কৃতিক ঐতিহ্য সংরক্ষণ ও প্রচার করা।',
                  icon: '🏛️',
                  gradient: 'from-green-500 to-teal-500'
                }
              ].map((mission, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-500"
                  style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both` }}
                >
                  <div className={`h-2 bg-gradient-to-r ${mission.gradient}`}></div>
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-r ${mission.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-3xl">{mission.icon}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">{mission.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-center">{mission.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Mission Statement */}
            <div className="mt-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-3xl p-8 text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">আমাদের দৃঢ় অঙ্গীকার</h3>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
                "ধর্ম, সংস্কৃতি ও মানবতার সেবায় আমরা নিবেদিতপ্রাণ। আমাদের উদ্দেশ্য কেবল একটি মন্দির পরিচালনা নয়, বরং সমাজের সকল স্তরের মানুষের কল্যাণে কাজ করা এবং আমাদের ঐতিহ্যবাহী মূল্যবোধগুলো পরবর্তী প্রজন্মের কাছে পৌঁছে দেওয়া।"
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'team' && (
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">পরিচালনা পর্ষদ</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-4 text-lg">আমাদের নিবেদিতপ্রাণ সেবকবৃন্দ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-500"
                  style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/image/temple.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    
                    <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full opacity-70 animate-pulse"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-orange-500 font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-600 leading-relaxed">{member.description}</p>
                    
                    {/* Contact Info */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>মন্দির প্রাঙ্গণ</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'developers' && (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">ডেভেলপার</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-4 text-lg">এই ওয়েবসাইটের স্রষ্টা</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 h-32"></div>
              <div className="relative px-10 pb-8">
                <div className="flex flex-col md:flex-row items-center -mt-16">
                  <div className="relative z-10 mb-6 md:mb-0 md:mr-8">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <img
                        src={developers[0].image}
                        alt={developers[0].name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/image/template-avatar.jpg";
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{developers[0].name}</h3>
                    <p className="text-xl text-purple-600 mb-4 font-semibold mt-8">{developers[0].role}</p>
                    <p className="text-gray-600 text-lg mb-6">{developers[0].description}</p>
                    
                    {/* Skills */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {['React', 'Node.js', 'MongoDB', 'Express.js', 'TypeScript', 'Tailwind CSS'].map((skill) => (
                          <span key={skill} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Social Links */}
                    <div className="flex justify-center md:justify-start space-x-4">
                      {developers[0].links.github && (
                        <a
                          href={developers[0].links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-3 bg-gray-100 hover:bg-gray-800 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                      {developers[0].links.facebook && (
                        <a
                          href={developers[0].links.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-3 bg-blue-100 hover:bg-blue-600 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {developers[0].links.instagram && (
                        <a
                          href={developers[0].links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-3 bg-pink-100 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Project Statistics */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-6 text-center">Project Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                      <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                      <div className="text-gray-600">MERN Stack Development</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                      <div className="text-3xl font-bold text-green-600 mb-2">Modern</div>
                      <div className="text-gray-600">Technology Stack</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                      <div className="text-3xl font-bold text-purple-600 mb-2">Responsive</div>
                      <div className="text-gray-600">Design Approach</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-4">প্রকল্প সম্পর্কে</h4>
                <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed">
                  এই ওয়েবসাইটটি বীরশিপুর সাধারণ হরিসভার জন্য বিশেষভাবে তৈরি করা হয়েছে। 
                  আধুনিক প্রযুক্তি ব্যবহার করে ঐতিহ্যবাহী মন্দিরের সেবা ও কার্যক্রমকে 
                  ডিজিটাল প্ল্যাটফর্মে উপস্থাপনের একটি প্রয়াস।
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Sticky Navigation */
        .sticky {
          position: -webkit-sticky;
          position: sticky;
        }
        
        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #f97316, #ef4444);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ea580c, #dc2626);
        }
      `}</style>
    </div>
  );
};

export default About;