import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0); // Page load scroll to top
  }, []);

  return (
<section className="page_404 flex flex-col items-center justify-center min-h-screen px-4 bg-white text-center font-poppins">
  <div className="four_zero_four_bg w-full max-w-2xl mx-auto"></div>

  <div className="contant_box_404 w-full max-w-xl bg-white rounded-xl p-6 md:p-10 mt-6">
    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      Feature Under Development
    </h3>

    <p className="text-base md:text-lg text-gray-700 mb-6 font-medium">
      This section is currently under construction.
      <br />
      For more details, please contact the system administrator:
    </p>

    <a
      href="tel:+916290187210"
      className="text-lg text-orange-600 hover:text-orange-700 font-semibold block mb-6"
    >
      📞+91 6290187210
    </a>

    <button
      onClick={() => navigate("/")}
      className="bg-green-600 hover:bg-green-700 text-white text-base md:text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-green-700"
    >
      🏠 Back to Dashboard
    </button>
  </div>
</section>

  );
};

export default NotFound;
