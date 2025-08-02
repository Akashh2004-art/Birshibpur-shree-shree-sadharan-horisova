import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">About Temple</h3>
            <p className="text-gray-300">
              A sacred place dedicated to spiritual growth and community service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-gray-300 hover:text-orange-400 transition-colors">Events</Link></li>
              <li><Link to="/gallery" className="text-gray-300 hover:text-orange-400 transition-colors">Gallery</Link></li>
              <li><Link to="/booking" className="text-gray-300 hover:text-orange-400 transition-colors">Book Puja</Link></li>
              <li><Link to="/donations" className="text-gray-300 hover:text-orange-400 transition-colors">Donations</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a 
                  href="tel:6290187210"
                  className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>6290187210</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:akashsaha0751@gmail.com"
                  className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>akashsaha0751@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Follow Us</h3>
            <div>
              <a
                href="https://www.facebook.com/groups/harisabha/"
                className="flex items-center gap-3 group"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Group"
              >
                <div className="bg-blue-600 rounded-full p-2 group-hover:bg-blue-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:text-orange-400 transition-colors">
                  Facebook Group
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4 text-orange-400">Location</h3>
          <div className="relative h-80 w-full bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3687.4892760435387!2d88.08931797499179!3d22.44989997937561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a027a66e35d5555%3A0x766c7b15c7f0c0c5!2sF22X%2BWC6%2C%20Birshibpur%2C%20Uluberia%2C%20Howrah%2C%20West%20Bengal%20711316!5e0!3m2!1sen!2sin!4v1703827029432!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
            
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    let currentSrc = iframe.src;
                    // Extract current zoom level or default to 13
                    let zoomMatch = currentSrc.match(/!4f(\d+(?:\.\d+)?)/);
                    let currentZoom = zoomMatch ? parseFloat(zoomMatch[1]) : 13;
                    let newZoom = Math.min(currentZoom + 1, 20); // Max zoom 20
                    let newSrc = currentSrc.replace(/!4f\d+(?:\.\d+)?/, `!4f${newZoom}`);
                    iframe.src = newSrc;
                  }
                }}
                className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                title="Zoom In"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    let currentSrc = iframe.src;
                    // Extract current zoom level or default to 13
                    let zoomMatch = currentSrc.match(/!4f(\d+(?:\.\d+)?)/);
                    let currentZoom = zoomMatch ? parseFloat(zoomMatch[1]) : 13;
                    let newZoom = Math.max(currentZoom - 1, 1); // Min zoom 1
                    let newSrc = currentSrc.replace(/!4f\d+(?:\.\d+)?/, `!4f${newZoom}`);
                    iframe.src = newSrc;
                  }
                }}
                className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                title="Zoom Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                </svg>
              </button>
            </div>

            {/* Mobile Direction Link */}
            <a 
              href="geo:22.449900,88.089318?q=F22X%2BWC6%2C%20Birshibpur%2C%20Uluberia%2C%20Howrah%2C%20West%20Bengal%20711316"
              className="absolute bottom-4 left-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                window.open("https://www.google.com/maps/dir/?api=1&destination=22.449900,88.089318", "_blank");
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>© {new Date().getFullYear()} Harisabha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;