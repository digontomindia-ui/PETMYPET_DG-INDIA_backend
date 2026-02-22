import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col-reverse md:flex-row h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 z-50">
          <Logo />
      </div>
      
      {/* Mobile: Image Top, Desktop: Image Right (Reordered visually via flex-col-reverse or grid) */}
      
      {/* Content Section */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
        className="bg-white/80 backdrop-blur-md md:bg-white/40 md:backdrop-blur-none rounded-t-[40px] md:rounded-none p-8 pt-10 pb-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-none z-20 mt-auto md:mt-0 md:flex-1 md:h-full md:flex md:flex-col md:justify-center md:pl-20 md:pr-12"
      >
        <div className="md:max-w-md">
            <h2 className="text-3xl md:text-5xl font-bold text-center md:text-left text-gray-900 mb-4 leading-tight">
              Grow Your Language <br/>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-500">Skills with AI.</span>
            </h2>
            
            <p className="text-center md:text-left text-gray-600 text-sm md:text-lg mb-8 leading-relaxed px-4 md:px-0">
              Learn new languages faster with smart AI guidance made for you.
            </p>

            <div className="space-y-4 md:space-y-0 md:flex md:gap-4">
              <button 
                onClick={() => navigate('/signin')}
                className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-[0.98] transform"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full py-4 bg-white text-black border border-gray-200 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors active:scale-[0.98] transform"
              >
                Create account
              </button>
            </div>
        </div>

        <div className="flex justify-center mt-6 md:hidden">
            <div className="w-32 h-1.5 bg-gray-900 rounded-full opacity-10"></div>
        </div>
      </motion.div>

       {/* Image Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center relative md:h-full -mt-10 md:mt-0 md:order-last"
      >
         <div className="relative w-full max-w-[350px] md:max-w-[600px] aspect-square">
            {/* Abstract glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-[500px] md:h-[500px] bg-purple-300/30 rounded-full blur-3xl"></div>
            <img 
              src="/hero-image.png" 
              alt="Learning illustration" 
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
            />
         </div>
      </motion.div>
    </div>
  );
}
