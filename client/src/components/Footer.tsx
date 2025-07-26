import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About Temple</h3>
            <p className="text-gray-300">
              A sacred place dedicated to spiritual growth and community service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-gray-300 hover:text-white">Events</Link></li>
              <li><Link to="/gallery" className="text-gray-300 hover:text-white">Gallery</Link></li>
              <li><Link to="/booking" className="text-gray-300 hover:text-white">Book Puja</Link></li>
              <li><Link to="/donations" className="text-gray-300 hover:text-white">Donations</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a 
                  href="tel:6290187210"
                  className="flex items-center gap-2 hover:text-white"
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
                  className="flex items-center gap-2 hover:text-white"
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
            <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
            <div>
              <a
                href="https://www.facebook.com/groups/harisabha/"
                className="flex items-center gap-3 group"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Group"
              >
                <div className="bg-gray-300 rounded-full p-2 group-hover:bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:text-white">
                  Facebook Group
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Map Section - Now full width below other content */}
        <div className="mt-12 px-4">
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="relative h-96 w-full bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3687.4892760435387!2d88.08931797499179!3d22.44989997937561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a027a66e35d5555%3A0x766c7b15c7f0c0c5!2sF22X%2BWC6%2C%20Birshibpur%2C%20Uluberia%2C%20Howrah%2C%20West%20Bengal%20711316!5e0!3m2!1sen!2sin!4v1703827029432!5m2!1sen!2sin&disableDefaultUI=1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
            <a 
              href="geo:22.449900,88.089318?q=F22X%2BWC6%2C%20Birshibpur%2C%20Uluberia%2C%20Howrah%2C%20West%20Bengal%20711316"
              className="absolute inset-0 bg-transparent z-10 hover:bg-black hover:bg-opacity-10"
              style={{ pointerEvents: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                if (e.detail === 1) {
                  window.location.href = "geo:22.449900,88.089318?q=F22X%2BWC6%2C%20Birshibpur%2C%20Uluberia%2C%20Howrah%2C%20West%20Bengal%20711316";
                }
              }}
            />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>© {new Date().getFullYear()} Harisabha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;