import { assets } from "../../assets/user/assets";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Star, Clock } from "lucide-react";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-indigo-700 rounded-3xl shadow-2xl">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center px-6 lg:px-12 py-12 lg:py-16">
        {/* Left Content */}
        <div className="lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Users className="w-4 h-4 text-white mr-2" />
            <span className="text-white text-sm font-medium">Join 100+ Trusted Doctors</span>
        </div>
          
          <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Ready to Start Your
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Health Journey?
            </span>
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Create your account today and get access to our network of certified healthcare professionals. 
            Book appointments instantly and take control of your health.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-8">
        <button
          onClick={() => {
            navigate("/login");
            scrollTo(0, 0);
          }}
              className="group bg-white text-primary px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
        >
              Create Account
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
            <div className="flex items-center text-white">
              <div className="flex items-center mr-4">
                <Star className="w-5 h-5 text-yellow-300 mr-1" />
                <span className="text-sm">4.9 Rating</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-200 mr-1" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
      </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center lg:justify-start gap-6 text-white/80 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>HIPAA Compliant</span>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="lg:w-1/2 relative">
          <div className="relative z-10">
        <img
              className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
          src={assets.appointment_img}
              alt="Healthcare Appointment"
        />
            {/* Floating Stats Cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">100+</div>
                  <div className="text-xs text-gray-600">Doctors</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">50k+</div>
                  <div className="text-xs text-gray-600">Patients</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
