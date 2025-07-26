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
    name: "শ্রী অনিল কুমার দাস",
    role: "সভাপতি",
    image: "/assets/image/temple.jpg",
    description: "মন্দির পরিচালনা কমিটির সভাপতি, ২০ বছর ধরে সেবারত"
  },
  {
    id: 3,
    name: "শ্রী বিকাশ চন্দ্র দে",
    role: "সম্পাদক",
    image: "/assets/image/temple.jpg",
    description: "মন্দির উন্নয়ন ও সংস্কার কার্যক্রমের প্রধান সমন্বয়ক"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            আমাদের মন্দির সম্পর্কে
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto">
            ১৯৫০ সাল থেকে ধর্মীয় সেবায় নিয়োজিত
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex justify-center -mb-px">
            <button
              onClick={() => setSelectedTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'history'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ইতিহাস
            </button>
            <button
              onClick={() => setSelectedTab('mission')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'mission'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              লক্ষ্য ও উদ্দেশ্য
            </button>
            <button
              onClick={() => setSelectedTab('team')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'team'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              পরিচালনা পর্ষদ
            </button>
            <button
              onClick={() => setSelectedTab('developers')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'developers'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ডেভেলপার
            </button>
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12">
        {selectedTab === 'history' && (
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2 className="text-3xl font-bold mb-6">মন্দিরের ইতিহাস</h2>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <p className="mb-4">
                ১৯৫০ সালে স্থানীয় হিন্দু সম্প্রদায়ের উদ্যোগে এই মন্দিরের প্রতিষ্ঠা করা হয়। প্রথম দিকে এটি ছিল একটি ছোট মন্দির, 
                যেখানে স্থানীয় ভক্তরা নিয়মিত পূজা-অর্চনা করতেন।
              </p>
              <p className="mb-4">
                ১৯৭৫ সালে মন্দিরের প্রথম সংস্কার কাজ শুরু হয়। এই সময় মন্দিরের আয়তন বৃদ্ধি করা হয় এবং নতুন মূর্তি স্থাপন করা হয়।
              </p>
              <p>
                বর্তমানে এই মন্দির একটি প্রধান ধর্মীয় কেন্দ্র হিসেবে পরিচিত, যেখানে প্রতিদিন শত শত ভক্ত দর্শন করতে আসেন।
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">উল্লেখযোগ্য ঘটনাবলী</h3>
              <ul className="list-disc pl-6">
                <li className="mb-2">১৯৫০ - মন্দির প্রতিষ্ঠা</li>
                <li className="mb-2">১৯৭৫ - প্রথম সংস্কার কাজ</li>
                <li className="mb-2">১৯৯০ - নতুন মূর্তি স্থাপন</li>
                <li className="mb-2">২০০০ - মন্দির কমপ্লেক্স সম্প্রসারণ</li>
                <li>২০১৫ - আধুনিক সুযোগ-সুবিধা যোগ</li>
              </ul>
            </div>
          </div>
        )}

        {selectedTab === 'mission' && (
          <div className="max-w-3xl mx-auto prose prose-lg">
            <h2 className="text-3xl font-bold mb-6">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
            <div className="grid gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">ধর্মীয় শিক্ষা প্রসার</h3>
                <p>
                  নতুন প্রজন্মের মধ্যে ধর্মীয় শিক্ষা ও সনাতন হিন্দু ধর্মের মূল্যবোধ প্রসার করা।
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">সামাজিক সেবা</h3>
                <p>
                  দরিদ্র ও অসহায় মানুষের সেবা, শিক্ষা প্রতিষ্ঠান পরিচালনা, এবং সামাজিক উন্নয়নে অবদান রাখা।
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">সাংস্কৃতিক ঐতিহ্য সংরক্ষণ</h3>
                <p>
                  বাংলার সনাতন ধর্মীয় ও সাংস্কৃতিক ঐতিহ্য সংরক্ষণ ও প্রচার করা।
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'team' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">পরিচালনা পর্ষদ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                    <p className="text-orange-500 mb-3">{member.role}</p>
                    <p className="text-gray-600">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'developers' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">ডেভেলপার</h2>
            <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
              
            </p>
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-3xl">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="md:w-1/3 mb-6 md:mb-0">
                      <img
                        src={developers[0].image}
                        alt={developers[0].name}
                        className="w-48 h-48 rounded-full object-cover mx-auto"
                      />
                    </div>
                    <div className="md:w-2/3 md:pl-8 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">{developers[0].name}</h3>
                      <p className="text-orange-500 text-xl mb-4">{developers[0].role}</p>
                      <p className="text-gray-600 mb-6">{developers[0].description}</p>
                      <div className="flex justify-center md:justify-start space-x-4">
                        {developers[0].links.github && (
                          <a
                            href={developers[0].links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                            </svg>
                          </a>
                        )}
                        {developers[0].links.linkedin && (
                          <a
                            href={developers[0].links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {developers[0].links.portfolio && (
                          <a
                            href={developers[0].links.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                            </svg>
                          </a>
                        )}
                        {developers[0].links.facebook && (
                          <a
                            href={developers[0].links.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}
                        {developers[0].links.instagram && (
                          <a
                            href={developers[0].links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default About; 