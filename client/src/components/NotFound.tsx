import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on component mount
  }, []);

  return (
    <section className="page_404">
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <div className="col-sm-10 col-sm-offset-1 text-center">
              <div className="four_zero_four_bg">
                <h1 className="text-center">404</h1>
              </div>

              <div className="contant_box_404 p-8">
                <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 drop-shadow-lg">
                  Coming soon
                </h3>

                <p className="text-xl md:text-2xl text-gray-700 mb-8 font-semibold drop-shadow-md">
                  Contact admin for more information. <br />
                  <a
                    href="tel:+910000000000"
                    className="text-lg text-orange-600 hover:text-orange-700 font-semibold block mb-6"
                  >
                   📞+91 0000000000
                  </a>
                </p>

                <button
                  onClick={() => navigate('/')}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg md:text-xl font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-green-700"
                >
                  🏠 Return to home page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
