import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-white font-bold text-xl flex items-center mb-4">
              <span className="bg-primary text-white p-1 rounded mr-1">
                <i className="fas fa-tasks"></i>
              </span>
              FindMyHelper
            </div>
            <p className="mb-4">Connect with skilled local service providers for any job, big or small.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-300 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">For Clients</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Reviews</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Service guarantee</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">For Providers</h3>
            <ul className="space-y-2">
              <li><Link href="/auth" className="hover:text-white transition-colors">Become a provider</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Provider requirements</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Earnings</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Insurance</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Success stories</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">Help center</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Contact us</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Privacy policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Terms of service</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Trust & safety</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-6 mt-6">
          <p className="text-sm text-center">© {new Date().getFullYear()} FindMyHelper. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
