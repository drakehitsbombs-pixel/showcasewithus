import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/discover" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Discover
                </Link>
              </li>
              <li>
                <Link 
                  to="/showcase" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Showcase
                </Link>
              </li>
              <li>
                <Link 
                  to="/discover?styles=surfing" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Surfing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/help" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">ShowCase</h3>
            <p className="text-sm text-muted-foreground">
              Connect photographers with clients for unforgettable shoots.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ShowCase. All rights reserved.
          </p>
          <p className="text-xs opacity-70 text-muted-foreground">
            Some pages include ads or affiliate links. Featured listings are paid and clearly labeled.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
